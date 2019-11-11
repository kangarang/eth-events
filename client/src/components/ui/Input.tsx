import * as React from 'react';
import styled from 'styled-components';
import {
  space,
  color,
  layout,
  typography,
  flexbox,
  border,
  background,
  shadow,
  position,
} from 'styled-system';

const StyledInput: any = styled.input`
  border: 1px solid grey;
  border-radius: 2px;
  padding: 0.8em;
  font-size: 0.8em;
  margin: 1em 0;

  color: black;
  background-color: #EBEBEB;

  ${space};
  ${color};
  ${layout};
  ${typography};
  ${flexbox};
  ${border};
  ${background}
  ${shadow};
  ${position};
`;

const TextArea: any = styled.textarea`
  border: 1px solid grey;
  border-radius: 2px;
  padding: 0.8em;
  font-size: 0.8em;
  margin: 1em 0;

  color: black;
  background-color: #EBEBEB;

  ${space};
  ${color};
  ${layout};
  ${typography};
  ${flexbox};
  ${border};
  ${background}
  ${shadow};
  ${position};
`;

interface Props {
  type?: string;
  width?: string;
  handleChange(value: string): void;
}

const Input: any = (props: Props) => {
  if (props.type === 'textarea') {
    return <TextArea {...props} onChange={(e: any) => props.handleChange(e.target.value)} />;
  }
  return (
    <StyledInput
      {...props}
      type={props.type || 'text'}
      onChange={(e: any) => props.handleChange(e.target.value)}
    />
  );
};

Input.displayName = 'Input';

export default Input;
