import cron from 'node-cron';
import notifier from 'node-notifier';
import dayjs from 'dayjs';
import { EnphaseClient } from './enphase';
import { SensiboClient } from './sensibo';

const MIN_HOUR = 8;

const MAX_HOUR = 18;

const enphaseClient = new EnphaseClient({
  apiKey: process.env.ENPHASE_API_KEY.trim(),
  clientId: process.env.ENPHASE_CLIENT_ID.trim(),
  clientSecret: process.env.ENPHASE_CLIENT_SECRET.trim()
});

const AC_KITCHEN = {
  on: false,
  consumption: 320,
  id: process.env.AC_KITCHEN_ID
};

const AC_OFFICE = {
  on: false,
  consumption: 100,
  id: process.env.AC_OFFICE_ID
};

const sensiboClient = new SensiboClient({ apiKey: process.env.SENSIBO_API_KEY });

const init = async () => {
  await enphaseClient.init();
  //  Enable once script is running
  await enphaseClient.refreshAccessToken();

  checkSolarConsumption();
};

const updateAcDeviceState = async () => {
  const acKitchen = await sensiboClient.getDeviceAcState(AC_KITCHEN.id); // Office

  const acOffice = await sensiboClient.getDeviceAcState(AC_OFFICE.id); // Office

  const acKitchenState = acKitchen.result?.[0]?.acState?.on ?? false;

  const acOfficeState = acOffice.result?.[0]?.acState?.on ?? false;

  AC_KITCHEN.on = acKitchenState;

  AC_OFFICE.on = acOfficeState;
};

const turnAcOff = async () => {
  await updateAcDeviceState();

  if (AC_KITCHEN.on) {
    await sensiboClient.setDeviceAcState({ devivceId: AC_KITCHEN.id, on: false });
    console.log('Turned kitchen off - end of day');
  }

  if (AC_OFFICE.on) {
    await sensiboClient.setDeviceAcState({ devivceId: AC_OFFICE.id, on: false });
    console.log('Turned office off - end of day');
  }
};

const checkSolarConsumption = async () => {
  const currentHour = dayjs().hour();

  if (currentHour >= MIN_HOUR && currentHour <= MAX_HOUR) {
    await updateAcDeviceState();

    let currentSolarExport = 0;

    try {
      const exportData = await enphaseClient.getCurrentExport(process.env.SYSTEM_ID);

      currentSolarExport = exportData.intervals?.[0]?.[0]?.wh_exported ?? 0;
    } catch (e) {
      console.log('Unable to load solar consumption');
    }

    console.log(`Current export: ${currentSolarExport}`);

    const hasKitchenBeenTurnedOn = false;

    // if (AC_KITCHEN.on === true) {
    //   if (currentSolarExport < 10) {
    //     await sensiboClient.setDeviceAcState({
    //       devivceId: AC_KITCHEN.id,
    //       on: false
    //     });
    //     console.log('Turned kitchen off');
    //     notifier.notify({
    //       title: 'AC State changed',
    //       message: 'Turned kitchen off'
    //     });
    //   }
    // } else if (AC_KITCHEN.on === false) {
    //   if (currentSolarExport > AC_KITCHEN.consumption + 20) {
    //     await sensiboClient.setDeviceAcState({
    //       devivceId: AC_KITCHEN.id,
    //       on: true,
    //       fanLevel: 'medium'
    //     });
    //     hasKitchenBeenTurnedOn = true;
    //     console.log('Turned kitchen on');
    //     notifier.notify({
    //       title: 'AC State changed',
    //       message: 'Turned kitchen on'
    //     });
    //   }
    // }

    if (AC_OFFICE.on === true) {
      if (currentSolarExport < 10) {
        await sensiboClient.setDeviceAcState({ devivceId: AC_OFFICE.id, on: false });
        console.log('Turned office off');
        notifier.notify({
          title: 'AC State changed',
          message: 'Turned office off'
        });
      }
    } else if (AC_OFFICE.on === false) {
      const currentSolarProductionMinusKitchen = hasKitchenBeenTurnedOn
        ? currentSolarExport - AC_OFFICE.consumption
        : currentSolarExport;

      if (currentSolarProductionMinusKitchen > AC_OFFICE.consumption + 20) {
        await sensiboClient.setDeviceAcState({
          devivceId: AC_OFFICE.id,
          on: true,
          fanLevel: 'medium',
          targetTemperature: 26
        });
        console.log('Turned office on');
        notifier.notify({
          title: 'AC State changed',
          message: 'Turned office on'
        });
      }
    }
  }
};

init();

cron.schedule('20,35,50,05 * * * *', () => checkSolarConsumption());

// https://crontab.guru/every-day-7am
cron.schedule(
  '0 6 * * *',
  async () => {
    await enphaseClient.refreshAccessToken();
    notifier.notify({ message: 'Refreshed access token' });
  },
  {
    timezone: 'Australia/Melbourne'
  }
);

cron.schedule(
  '0 18 * * *',
  () => {
    turnAcOff();
  },
  {
    timezone: 'Australia/Melbourne'
  }
);
