import Tezoro from './abi/Tezoro';
import getBackups from './get-backups';
import publicClient from './public-client';

export default async function getActiveBackups(token: string) {
  const backups = await getBackups(token);
  const backupsTokenAddresses = await publicClient.multicall({
    allowFailure: false,
    contracts: backups.map(
      (backup) =>
        ({
          address: backup.contractAddress,
          abi: Tezoro,
          functionName: 'tokenAddress' as const,
        } as const),
    ),
  });
  const backupsState = await publicClient.multicall({
    allowFailure: false,
    contracts: backups.map(
      (backup) =>
        ({
          address: backup.contractAddress,
          abi: Tezoro,
          functionName: 'state',
        } as const),
    ),
  });

  const activeBackups = backups
    .map((backup, index) => {
      const backupState = backupsState[index];
      return {
        ...backup,
        tokenAddress: backupsTokenAddresses[index],
        isTerminalState: backupState !== undefined && backupState > 3,
      };
    })
    .filter((backup) => !backup.isTerminalState);
  return activeBackups;
}
