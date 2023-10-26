type Nullable<T> = T | null;

export interface SensiboOptions {
  apiKey: string;
  sensiboBaseUrl?: string;
}

export interface SensiboTimestamp {
  time: string;
  secondsAgo: number;
}

export interface AcState {
  on: boolean;
  mode: 'heat' | 'cool' | 'fan' | 'dry' | 'auto';
  fanLevel: 'low' | 'medium' | 'high' | 'auto' | 'quiet';
  targetTemperature: number;
  temperatureUnit: 'C' | 'F';
  swing:
    | 'fixedMiddleTop'
    | 'fixedMiddleBottom'
    | 'fixedMiddle'
    | 'rangeFull'
    | 'rangeUp'
    | 'rangeDown'
    | 'rangeMiddle'
    | 'off';
  horizontalSwing:
    | 'fixedCenterRight'
    | 'fixedCenterLeft'
    | 'fixedCenter'
    | 'rangeFull'
    | 'rangeLeft'
    | 'rangeRight'
    | 'rangeCenter'
    | 'off';
  light: 'on' | 'off';
  timestamp: SensiboTimestamp;
}

export interface AcStateResult {
  acState: AcState;
  status: 'success' | 'error';
  id: string;
  changedProperties: string[];
  reason: string;
  failureReason: Nullable<string>;
  time: SensiboTimestamp;
}

export interface SensiboResponse<T extends {} | []> {
  status: 'success' | 'error';
  result: T;
}

interface SetDeviceStatProps {
  devivceId: string;
  on: boolean;
  mode?: AcState['mode'];
  targetTemperature?: number;
  fanLevel?: AcState['fanLevel'];
  temperatureUnit?: AcState['temperatureUnit'];
}

export type SetDeviceAcState = (
  props: SetDeviceStatProps
) => Promise<SensiboResponse<AcStateResult>>;
