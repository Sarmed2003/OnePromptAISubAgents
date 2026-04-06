import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Note } from '../types/index';
import { generateId, getCurrentTimestamp } from './utils';

const TABLE_NAME = process.env.NOTES_TABLE_NAME || 'notes';
const REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

class NoteStore {
  async getAllNotes(): Promise<Note[]> {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
      });
      const response = await docClient.send(command);
      return (response.Items as Note[]) || [];
    } catch (err) {
      console.error('getAllNotes failed:', err);
      throw err;
    }
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid note ID');
      }
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          id,
        },
      });
      const response = await docClient.send(command);
      return response.Item as Note | undefined;
    } catch (err) {
      console.error('getNoteById failed:', err);
      throw err;
    }
  }

  async createNote(title: string, content: string, userId?: string): Promise<Note> {
    try {
      if (!title || typeof title !== 'string') {
        throw new Error('Invalid title');
      }
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content');
      }

      const id = generateId();
      const now = getCurrentTimestamp();
      const note: Note = {
        id,
        title,
        content,
        createdAt: now,
        updatedAt: now,
        userId: userId || 'anonymous',
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: note,
      });
      await docClient.send(command);
      return note;
    } catch (err) {
      console.error('createNote failed:', err);
      throw err;
    }
  }

  async updateNote(id: string, title: string, content: string): Promise<Note | undefined> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid note ID');
      }
      if (!title || typeof title !== 'string') {
        throw new Error('Invalid title');
      }
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content');
      }

      const now = getCurrentTimestamp();

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          id,
        },
        UpdateExpression: 'SET #title = :title, #content = :content, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#title': 'title',
          '#content': 'content',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':title': title,
          ':content': content,
          ':updatedAt': now,
        },
        ReturnValues: 'ALL_NEW',
      });

      const response = await docClient.send(command);
      return response.Attributes as Note | undefined;
    } catch (err) {
      console.error('updateNote failed:', err);
      throw err;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid note ID');
      }

      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          id,
        },
      });
      await docClient.send(command);
      return true;
    } catch (err) {
      console.error('deleteNote failed:', err);
      throw err;
    }
  }
}

export const noteStore: NoteStore = new NoteStore();
