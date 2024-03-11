import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';
import { ManageStateOperation } from '@metamask/snaps-sdk';
import { stateSchema } from './schemas';

describe('onRpcRequest', () => {
  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: -32601,
      message: 'The method does not exist / is not available.',
      stack: expect.any(String),
      data: {
        method: 'foo',
        cause: null,
      },
    });
  });

  it('parses the state', async () => {
    const { request } = await installSnap();

    const state = await request({
      method: 'snap_manageState',
      params: {
        operation: ManageStateOperation.GetState,
        encrypted: true,
      },
    });
    const parsedStateResult = stateSchema.safeParse(state);
    expect(parsedStateResult.success).toBe(true);
  });

  it('cronjob', async () => {
    const { onCronjob } = await installSnap();

    const { response } = await onCronjob({
      method: 'checkTokens',
    });
    expect('result' in response).toBe(true);
  });
});
