import { utils } from 'ethers';

const nonNumRegex = /^([^0-9]*)$/;

export function printEvent(event) {
  const { name, blockNumber, transactionHash, values, timestamp } = event;
  const datetime = new Date(timestamp * 1000).toLocaleString();

  console.log();
  console.log(name);
  console.log(datetime);
  console.log('-'.repeat(datetime.length));
  console.log('block:', blockNumber);
  console.log('txHash:', transactionHash);
  console.log('from:', event.sender);
  console.log('to:', event.recipient);

  Object.keys(values).map(arg => {
    let value = values[arg];
    // filter out numerical duplicates, like { 0: '0x1234', voter: '0x1234' }, and the `length` field
    if (nonNumRegex.test(arg) && arg !== 'length') {
      if (value.hasOwnProperty('_hex')) {
        value = value.toString();
      }
      if (arg === 'numTokens') {
        value = utils.formatUnits(value, 18).toString();
      }
      console.log(`${arg}:`, value);
    }
  });
  console.log();
}
