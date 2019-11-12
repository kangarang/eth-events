import * as React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  background: #f6f8fa;
  padding: 0.5rem;
`;

const DisplayJSON = (data: any) => (
  <Wrapper>
    <strong>Injected data</strong>
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  </Wrapper>
);
export default DisplayJSON;
