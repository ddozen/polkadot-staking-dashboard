// Copyright 2022 @rossbulat/polkadot-staking-experience authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect } from 'react';
import { useModal } from '../contexts/Modal';
import { useSubscan } from '../contexts/Subscan';
import { EraPoints as EraPointsGraph } from '../library/Graphs/EraPoints';
import { SubscanButton } from '../library/SubscanButton';
import { GraphWrapper } from '../library/Graphs/Wrappers';
import { useSize, formatSize } from '../library/Graphs/Utils';
import Identicon from '@polkadot/react-identicon';
import { clipAddress } from '../Utils';
import { useNetworkMetrics } from '../contexts/Network';

export const EraPoints = (props: any) => {

  const { config } = useModal();
  const { address } = config;
  const { fetchEraPoints }: any = useSubscan();
  const { metrics } = useNetworkMetrics();

  const [list, setList] = useState([]);

  const ref: any = React.useRef();
  let size = useSize(ref.current);
  let { width, height, minHeight } = formatSize(size, 300);

  const handleEraPoints = async () => {
    const list = await fetchEraPoints(address, metrics.activeEra.index);
    setList(list);
  }

  useEffect(() => {
    handleEraPoints();
  }, []);

  return (
    <>
      <SubscanButton />
      <div className='header'>
        <Identicon
          value={address}
          size={32}
          theme="polkadot"
          style={{ cursor: 'default', marginRight: '0.75rem' }}
        />
        <h1>{clipAddress(address)}</h1>
      </div>
      <div className='body'>
        <GraphWrapper style={{ margin: '0 0.5rem', height: 275 }} flex>

          <div className='head' style={{ padding: 0 }}>
            <h3>Recent Era Points</h3>
          </div>

          <div className='inner' ref={ref} style={{ minHeight: minHeight }}>
            <div className='graph' style={{ height: `${height}px`, width: `${width}px`, position: 'absolute', left: '-1rem' }}>
              <EraPointsGraph
                items={list}
                height={200}
              />
            </div>
          </div>
        </GraphWrapper>
      </div>
    </>
  )
}

export default EraPoints;