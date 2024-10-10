export interface Settings {
  test: "none" | "random" | "scheduled";
  randomness: number;
  count: number;
  tries: number;
}

export const settings: Settings = {
  test: "none",
  randomness: 25,
  count: 1,
  tries: 0,
}

export const set = (formData: FormData) => {
  settings.test = formData.get("test") as Settings["test"];
  settings.randomness = Number(formData.get("randomness"));
  settings.count = Number(formData.get("count"));
  settings.tries = Number(formData.get("tries"));
}

let errorCount = 0;
let errorTries = 0;

export const clearErrors = () => {
  errorCount = settings.count;
  errorTries = settings.tries;
}

export const isError = () => {
  console.log("isError", settings, errorCount, errorTries);
  switch (settings.test) {
    case "random":
      return Math.random() < settings.randomness / 100;

    case "scheduled":
      if (errorTries == 0) {
        if (errorCount > 0) {
          console.log(`scheduled error #${settings.count - errorCount} out of ${settings.count}`);
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
