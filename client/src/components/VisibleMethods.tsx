import React, { useState } from 'react';
import { utils } from 'ethers';
import Box from './system/Box';
import A from './ui/A';
import { commifyBaseUnits } from '../utils/format';

const VisibleMethods = ({ methods, methodType, contract, contractName, handleHideMethod }: any) => {
  const [visibility, setVisibility] = useState(false);
  const [values, setValues]: any = useState({});

  async function handleClick(method: any) {
    try {
      const methodName = method.name.toLowerCase();
      let val = await contract[method.name]();
      console.log('method.name:', method.name);
      console.log('typeof val:', typeof val);

      // Stringify objects (BigNumbers), numbers, and booleans
      if (typeof val === 'object' && val.hasOwnProperty('_hex')) {
        val = val.toString();
      } else if (typeof val === 'number') {
        val = utils.bigNumberify(val).toString();
      } else if (typeof val === 'boolean') {
        if (val) {
          val = 'true';
        } else {
          val = 'false';
        }
      }

      // Convert base units, strip decimals, and format with commas
      if (
        methodName.includes('balance') ||
        methodName.includes('tokens') ||
        methodName.includes('totalsupply')
      ) {
        val = commifyBaseUnits(val);
      }

      // Format unix timestamps
      if (
        (methodName.includes('date') || methodName.includes('time')) &&
        !methodName.includes('tokens')
      ) {
        val = new Date(parseInt(val) * 1000).toLocaleString();
      }

      setValues({
        ...values,
        [method.name]: val,
      });
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      throw error;
    }
  }

  return (
    <Box mb={2}>
      <Box mb={0} onClick={() => setVisibility(!visibility)}>
        {`${methodType} (${methods.length})`}
      </Box>
      {visibility &&
        methods.map((method: any) => (
          <Box mb="0.5rem" key={method.name}>
            <Box fontSize="0.7rem">
              {`- `}
              {method.inputs.length === 0 && method.outputs.length === 1 ? (
                <A onClick={() => handleClick(method)}>{`${method.signature}`}</A>
              ) : (
                method.signature
              )}
              . . <A onClick={() => handleHideMethod(method.name, contractName)}>HIDE</A>
            </Box>
            <Box>{values[method.name] && values[method.name]}</Box>
          </Box>
        ))}
    </Box>
  );
};

export default VisibleMethods;
