import axios from 'axios';
import { SensiboOptions, SetDeviceAcState } from './types';

export class SensiboClient {
  private _apiKey: string;
  private _sensiboBaseUrl: string;

  constructor({ apiKey, sensiboBaseUrl = 'https://home.sensibo.com/api/v2' }: SensiboOptions) {
    this._apiKey = apiKey;
    this._sensiboBaseUrl = sensiboBaseUrl;
  }

  public getAllDevices = async () => {
    const url = `${this._sensiboBaseUrl}/users/me/pods`;

    return await this._getDataRequest(url);
  };

  public getDeviceInfo = async (devivceId: string) => {
    const url = `${this._sensiboBaseUrl}/pods/${devivceId}`;

    return await this._getDataRequest(url);
  };

  public getDeviceAcState = async (devivceId: string, limit: number = 5) => {
    const url = `${this._sensiboBaseUrl}/pods/${devivceId}/acStates?limit=${limit}`;

    return await this._getDataRequest(url);
  };

  public setDeviceAcState: SetDeviceAcState = async ({
    on,
    devivceId,
    mode = 'heat',
    fanLevel = 'quiet',
    targetTemperature = 24,
    temperatureUnit = 'C'
  }) => {
    const url = `${this._sensiboBaseUrl}/pods/${devivceId}/acStates`;

    return await this._postDataRequest(url, {
      acState: {
        on,
        mode,
        fanLevel,
        targetTemperature,
        temperatureUnit
      }
    });
  };

  private _getDataRequest = async (url: string) => {
    const hasParams = url.includes('?');

    const urlWithKey = `${url}${hasParams ? '&' : '?'}apiKey=${this._apiKey}`;

    try {
      const res = await axios(urlWithKey, {
        method: 'GET'
      });

      return await res.data;
    } catch (e) {
      this.logError(`${e.message} - ${e.details}`);

      throw e;
    }
  };

  private _postDataRequest = async (
    url: string,
    data: Record<string, string | number | boolean | Record<string, string | number | boolean>>
  ) => {
    const hasParams = url.includes('?');

    const urlWithKey = `${url}${hasParams ? '&' : '?'}apiKey=${this._apiKey}`;

    try {
      const res = await axios(urlWithKey, {
        method: 'POST',
        data
      });

      return await res.data;
    } catch (e) {
      this.logError(`${e.message} - ${e.details}`);

      throw e;
    }
  };

  private logError = (e: string) => {
    // eslint-disable-next-line no-console
    console.error(e);
  };
}
