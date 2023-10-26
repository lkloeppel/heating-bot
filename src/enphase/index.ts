import fs from 'fs/promises';
import dayjs from 'dayjs';
import axios from 'axios';
import { EnergeyExportTelemetry, EnphaseOptions } from './types';

const REFRESH_TOKEN_PATH = 'data/refreshToken.txt';

export class EnphaseClient {
  private _clientId: string;
  private _clientSecret: string;
  private _apiKey: string;
  private _enphaseBaseUrl: string;
  private _refreshToken: string;
  private _accessToken: string;

  constructor({
    clientId,
    clientSecret,
    apiKey,
    enphaseBaseUrl = 'https://api.enphaseenergy.com/'
  }: EnphaseOptions) {
    this._apiKey = apiKey;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._enphaseBaseUrl = enphaseBaseUrl;
  }

  public init = async () => {
    await this._loadRefreshToken();
  };

  private _getAuthToken = () =>
    Buffer.from(`${this._clientId}:${this._clientSecret}`).toString('base64');

  _setAccessToken = (accessToken: string) => {
    this._accessToken = accessToken;
  };

  _setRefreshToken = (refreshToken: string) => {
    this._refreshToken = refreshToken;
  };

  _saveRefreshToken = async () => {
    await fs.writeFile(REFRESH_TOKEN_PATH, this._refreshToken);
  };

  _loadRefreshToken = async () => {
    try {
      const data = await fs.readFile(REFRESH_TOKEN_PATH, 'utf-8');

      this._refreshToken = data;
    } catch (e) {
      this.logError(e);
    }
  };

  public authorize = async (redirectUrl: string) => {
    const url = `${this._enphaseBaseUrl}oauth/token?grant_type=authorization_code&redirect_uri=${redirectUrl}}`;

    const data = await this._doAuthRequest(url);

    this._accessToken = data.access_token;
    this._refreshToken = data.refresh_token;

    this._saveRefreshToken();

    return { accessToke: data.access_token, refreshToken: data.refresh_token };
  };

  public refreshAccessToken = async () => {
    const url = `${this._enphaseBaseUrl}oauth/token?grant_type=refresh_token&refresh_token=${this._refreshToken}`;

    const data = await this._doAuthRequest(url);

    this._accessToken = data.access_token;
    this._refreshToken = data.refresh_token;

    this._saveRefreshToken();

    return { accessToke: data.access_token, refreshToken: data.refresh_token };
  };

  public getAllSystems = async () => {
    const url = `${this._enphaseBaseUrl}/api/v4/systems?key=${this._apiKey}`;

    return await this._doDataRequest(url);
  };

  public getProductionData = async (systemId: string) => {
    const url = `${this._enphaseBaseUrl}/api/v4/systems/${systemId}/rgm_stats?key=${this._apiKey}`;

    return await this._doDataRequest(url);
  };

  public getConsumptionData = async (systemId: string) => {
    const startAt = dayjs().subtract(15, 'minutes').unix();

    const url = `${this._enphaseBaseUrl}/api/v4/systems/${systemId}/telemetry/consumption_meter?start_at=${startAt}&granularity=15mins&key=${this._apiKey}`;

    return await this._doDataRequest(url);
  };

  public getCurrentProduction = async (systemId: string) => {
    const productionPromise = this.getProductionData(systemId);

    const consumptionPromise = this.getConsumptionData(systemId);

    const data = await Promise.all([productionPromise, consumptionPromise]);

    const currentProduction = data[0].intervals.slice(-1);

    const currentConsumption = data[1].intervals.slice(-1);

    return (currentProduction[0]?.wh_del ?? 0) - (currentConsumption[0]?.enwh ?? 420);
  };

  public getCurrentExport: (systemId: string) => Promise<EnergeyExportTelemetry> =
    async systemId => {
      const startAt = dayjs().subtract(15, 'minutes').unix();

      const url = `${this._enphaseBaseUrl}/api/v4/systems/${systemId}/energy_export_telemetry?start_at=${startAt}&granularity=15mins&key=${this._apiKey}`;

      return await this._doDataRequest(url);
    };

  private _doAuthRequest = async (url: string) => {
    try {
      const res = await axios(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this._getAuthToken()}`
        }
      });

      // eslint-disable-next-line no-console
      console.log(res.data);

      return await res.data;
    } catch (e) {
      this.logError(`${e.message} - ${e.details}`);

      throw new Error('Test');
    }
  };

  private _doDataRequest = async (url: string) => {
    try {
      const res = await axios(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this._accessToken}`
        }
      });

      return await res.data;
    } catch (e) {
      this.logError(`${e.message} - ${e.details}`);

      throw new Error('Test');
    }
  };

  private logError = (e: string) => {
    // eslint-disable-next-line no-console
    console.error(e);
  };
}
