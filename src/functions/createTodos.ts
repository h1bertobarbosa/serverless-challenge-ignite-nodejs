import { v4 as uuidV4 } from 'uuid';
import { document } from '../utils/dynamodbClient';

interface ICreateTodo {
  title: string;
  deadline: string;
}

export const handle = async (event) => {
  const { user_id } = event.pathParameters;
  const { title, deadline } = JSON.parse(event.body) as ICreateTodo;

  const response = await document
    .scan({
      TableName: 'users_todos',
      FilterExpression: 'title = :title AND user_id = :user_id',
      ExpressionAttributeValues: {
        ':title': title,
        ':user_id': user_id,
      },
    })
    .promise();

  const todoAlreadyExists = response.Items[0];
  const expires_in = new Date(deadline).toISOString();

  if (todoAlreadyExists) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Todo already exists!',
      }),
      headers: {
        'Content-type': 'application/json',
      },
    };
  }

  await document
    .put({
      TableName: 'users_todos',
      Item: {
        id: uuidV4(),
        user_id,
        title,
        done: false,
        deadline: expires_in,
      },
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'Todo created!',
    }),
    headers: {
      'Content-type': 'application/json',
    },
  };
};
