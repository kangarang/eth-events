import * as React from 'react';
import styled from 'styled-components';
import { space, color, layout, typography, background, shadow } from 'styled-system';

const StyledButton: any = styled.button`
  border: 1px solid black;
  border-radius: 1px;
  padding: 0.8rem 1.2rem;
  font-size: 0.8rem;

  color: black;
  background-color: white;

  ${space};
  ${color};
  ${layout};
  ${typography};
  ${background}
  ${shadow};
`;

const Button: any = (props: any) => {
  return <StyledButton {...props} />;
};

Button.displayName = 'Button';

export default Button;
