export const initialParameterState = {
  source: '',
  multiSources: [] as string[],
  treefile: '',
  sequenceType: '',
  extendedParameter: '',
  prefixOutput: '',
  seed: 0,
};

export type ParameterState = {
  source: string;
  multiSources?: string[];
  treefile: string;
  sequenceType: string;
  extendedParameter: string;
  prefixOutput: string;
  seed?: number;
};
