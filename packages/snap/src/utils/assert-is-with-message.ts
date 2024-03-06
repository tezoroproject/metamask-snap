export default function assertIsWithMessage(
  candidate: unknown,
): asserts candidate is { message: unknown } {
  if (typeof candidate !== 'object' || candidate === null) {
    throw new Error('Assertion failed: candidate is not an object');
  }
  if (!('message' in candidate)) {
    throw new Error(
      'Assertion failed: candidate does not have a message property',
    );
  }
}
