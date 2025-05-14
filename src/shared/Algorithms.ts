
import { Algorithm } from './Algorithm';
import { AlgorithmFlat20 } from './AlgorithmFlat20';
import { AlgorithmNaiveReplenish } from './AlgorithmNaiveReplenish';
import { AlgorithmSmartReplenish } from './AlgorithmSmartReplenish';
import { AlgorithmAIDesigned } from './AlgorithmAIDesigned';
import { AlgorithmLookAheadLdTm } from './AlgorithmLookAheadLdTm';

// Create instances of each algorithm
export const Flat20Algorithm = new AlgorithmFlat20();
export const NaiveReplenishAlgorithm = new AlgorithmNaiveReplenish();
export const SmartReplenishAlgorithm = new AlgorithmSmartReplenish();
export const AIDesignedAlgorithm = new AlgorithmAIDesigned();
export const LookAheadLdTmAlgorithm = new AlgorithmLookAheadLdTm();

// Collection of all available algorithms
export const algorithms: { [key: string]: Algorithm } = {
  "Flat20": Flat20Algorithm,
  "NaiveReplenish": NaiveReplenishAlgorithm,
  "SmartReplenish": SmartReplenishAlgorithm,
  "AIDesigned": AIDesignedAlgorithm,
  "LookAheadLdTm": LookAheadLdTmAlgorithm
};
