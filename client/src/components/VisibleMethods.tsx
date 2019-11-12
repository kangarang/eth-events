import React, { useState } from 'react';
import Box from './system/Box';
import A from './ui/A';
import { stringifySolidityValues, formatTokens, formatUts } from '../utils/format';

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
      val = stringifySolidityValues(val);

      // Convert base units, strip decimals, and format with commas
      val = formatTokens(methodName, val);

      // Format unix timestamps
      val = formatUts(methodName, val);

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
