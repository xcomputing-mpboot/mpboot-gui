import Collapsible from 'react-collapsible';
import { SequenceType } from './SequenceType';
import { OutputPrefix } from './OutputPrefix';
import { Sources } from './Sources';
import { Treefile } from './Treefile';

import { ExecutionButton } from './ExecutionButton';
import { Seed } from './Seed';
import { ExecutionHistoryIterator } from './ExecutionHistoryIterator';
import { ExtendedParameter } from './ExtendedParameter';
import { HpcParameters } from './HpcParameters';

export const ParameterView = () => {
  return (
    <div className="parameter-section">
      <div className="btn-group">
        <ExecutionHistoryIterator />
        <ExecutionButton />
      </div>
      <Collapsible
        trigger={'Basic parameters'}
        transitionTime={1}
        open={true}
      >
        <table>
          <Sources />
          <Treefile />
          <SequenceType />
          <OutputPrefix />
          <Seed />
        </table>
      </Collapsible>
      <Collapsible
        trigger={'Advance parameters'}
        transitionTime={1}
      >
        <table>
          <ExtendedParameter />
        </table>
      </Collapsible>
      <Collapsible
        trigger={'HPC job submission'}
        transitionTime={1}
      >
        <table>
          <HpcParameters />
        </table>
      </Collapsible>
    </div>
  );
};
