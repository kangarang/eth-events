import styled from 'styled-components';
import { space, color, layout, typography, background, shadow } from 'styled-system';

const A: any = styled.a`
  text-decoration: none;
  color: blue;
  cursor: pointer;

  &:active,
  &:focus,
  &:visited {
    color: darkblue;
    transition: color 0.15s ease-in;
  }

  ${space};
  ${color};
  ${layout};
  ${typography};
  ${background}
  ${shadow};
`;

A.displayName = 'A';

export default A;
