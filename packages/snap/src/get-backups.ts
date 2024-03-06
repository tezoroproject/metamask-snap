import { API_URL } from './constants';
import { backupSchema } from './schemas';

export default async function getBackups(token: string) {
  const responseData = await fetch(`${API_URL}/user/backups`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json: unknown = await responseData.json();
  const parsedBackupsData = backupSchema.array().parse(json);
  return parsedBackupsData;
}
