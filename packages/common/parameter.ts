export interface Parameter {
  source?: string;
  multiSources?: string[];
  treefile?: string;
  sequenceType?: string;
  prefixOutput?: string;
  seed?: number;
  isExecutionHistory?: boolean;
  extendedParameter?: string;
}

export const convertParameterToCommandArgs = (parameter: Parameter): string[] => {
  const args = [] as string[];

  if (parameter.source) {
    args.push('-s');
    args.push(parameter.source);
  }
  if (parameter.treefile) {
    args.push(parameter.treefile);
  }
  if (parameter.sequenceType) {
    args.push('-st');
    args.push(parameter.sequenceType);
  }
  if (parameter.prefixOutput) {
    args.push('-pre');
    args.push(parameter.prefixOutput);
  }
  if (parameter.seed) {
    args.push('-seed');
    args.push(parameter.seed.toString());
  }

  if (parameter.extendedParameter) {
    args.push(parameter.extendedParameter);
  }

  return args;
};

export const convertCommandToParameter = (command: string): Parameter => {
  const parameter = {} as Parameter;

  const commandParts = command.split(' ');
  let remainedCommandParts = commandParts;

  const sourceIndex = commandParts.indexOf('-s');
  if (sourceIndex !== -1) {
    parameter.source = commandParts[sourceIndex + 1];
    remainedCommandParts = commandParts.slice(sourceIndex + 2);
  }

  const sequenceTypeIndex = commandParts.indexOf('-st');
  if (sequenceTypeIndex !== -1) {
    parameter.sequenceType = commandParts[sequenceTypeIndex + 1];
    remainedCommandParts = commandParts.slice(sequenceTypeIndex + 2);
  }

  const prefixOutputIndex = commandParts.indexOf('-pre');
  if (prefixOutputIndex !== -1) {
    parameter.prefixOutput = commandParts[prefixOutputIndex + 1];
    remainedCommandParts = commandParts.slice(prefixOutputIndex + 2);
  }

  const treefile = commandParts.find(part => part.includes('.treefile'));
  if (treefile) {
    parameter.treefile = treefile;
    remainedCommandParts = commandParts.filter(part => part !== treefile);
  }

  if (remainedCommandParts.length > 0) {
    parameter.extendedParameter = remainedCommandParts.join(' ');
  }
  return parameter;
};
