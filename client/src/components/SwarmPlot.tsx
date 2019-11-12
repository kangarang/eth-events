import React from 'react';
import { ResponsiveSwarmPlot } from '@nivo/swarmplot';
import styled from 'styled-components';
import { utils } from 'ethers';
import { fromBaseUnits } from '../utils/format';

const Wrapper = styled.div`
  height: 80vh;
`;

const SwarmPlot = ({ events }: any) => {
  console.log('events:', events);

  const data = events.TokenCapacitor.filter(e => e.name === 'Donation').map(e => {
    return {
      id: e.txHash + e.logIndex,
      group: 'TokenCapacitor',
      blockNumber: e.blockNumber,
      numTokens: e.values.numTokens,
    };
  });

  // console.log("data:", data);
  // return null

  const sizes = {
    sm: 5,
    md: 10,
    lg: 20,
    whale: 30,
  };

  return (
    <Wrapper>
      <ResponsiveSwarmPlot
        data={data}
        layout="horizontal"
        layers={['grid', 'axes', 'nodes', 'mesh', 'annotations']}
        groups={['Gatekeeper', 'TokenCapacitor', 'ParameterStore']}
        value="blockNumber"
        valueScale={{ type: 'linear', min: 8500000, max: 9079928 }}
        size={({ numTokens }) => {
          if (utils.bigNumberify(numTokens).lt('250000000000000000000')) {
            return sizes.sm;
          }
          if (utils.bigNumberify(numTokens).lt('600000000000000000000')) {
            return sizes.md;
          }
          if (utils.bigNumberify(numTokens).lt('1200000000000000000000')) {
            return sizes.lg;
          }
          return sizes.whale;
        }}
        forceStrength={4}
        simulationIterations={100}
        colors={{ scheme: 'nivo' }}
        borderColor={{
          from: 'color',
          modifiers: [
            ['darker', 0.6],
            ['opacity', 0.5],
          ],
        }}
        margin={{ top: 80, right: 100, bottom: 80, left: 100 }}
        axisTop={{
          orient: 'top',
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisRight={{
          orient: 'right',
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisBottom={{
          orient: 'bottom',
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisLeft={{
          orient: 'left',
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 0,
        }}
        motionStiffness={50}
        motionDamping={10}
      />
    </Wrapper>
  );
};

export default SwarmPlot;
