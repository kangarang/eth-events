import React from 'react';
import Flex from '../system/Flex';
import Input from '../ui/Input';

const Row = ({ children }: any) => (
  <Flex width={1} justifyBetween alignCenter>
    {children}
  </Flex>
);

export const Field = ({ label, value, handleChange, inputComponent }: any) => (
  <Row>
    <div>{label}</div>
    {inputComponent ? (
      inputComponent
    ) : (
      <Input width={0.6} value={value} handleChange={handleChange} />
    )}
  </Row>
);
