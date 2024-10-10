export interface Settings {
  test: "none" | "random" | "scheduled";
  randomness: number;
  errorCount: number;
  errorTries: number;

  delay: number;
  delayTries: number;
}

export const settings: Settings = {
  test: "none",
  randomness: 25,
  errorCount: 1,
  errorTries: 0,
  delay: 0,
  delayTries: 0,
}

export const set = (formData: FormData) => {
  settings.test = formData.get("test") as Settings["test"];
  settings.randomness = Number(formData.get("randomness"));
  settings.errorCount = Number(formData.get("count"));
  settings.errorTries = Number(formData.get("tries"));
  settings.delay = Number(formData.get("delay"));
  settings.delayTries = Number(formData.get("delayTries"));
}

let errorCount = 0;
let errorTries = 0;
let delayTries = 0;

export const clearErrors = () => {
  errorCount = settings.errorCount;
  errorTries = settings.errorTries;
  delayTries = settings.delayTries;
}

export const isError = async () => {

  if (settings.delay > 0) {
    if (delayTries == 0) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, settings.delay * 1000);
      });
    } 
    delayTries--;
  }

  console.log("isError", settings, errorCount, errorTries);
  switch (settings.test) {
    case "random":
      return Math.random() < settings.randomness / 100;

    case "scheduled":
      if (errorTries == 0) {
        if (errorCount > 0) {
          console.log(`scheduled error #${settings.errorCount - errorCount} out of ${settings.errorCount}`);
          errorCount--;
          return true;
        }
      }
      errorTries--;
      return false;
  
    default:
      return false;
  }
}
