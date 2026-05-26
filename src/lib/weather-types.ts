// Shared weather types — safe for both client and server import.

export type CurrentWeather = {
  temperature: number;
  weather_code: number;
  precipitation_prob: number;
  wind_speed: number;
  humidity: number;
  is_day: boolean;
  time: string;
};

export type HourlyPoint = {
  time: string;
  temperature: number;
  precipitation_probability: number;
  weather_code: number;
};

export type DailyPoint = {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  weather_code: number;
};

export type Forecast = {
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  past_rainfall: { date: string; rainfall: number }[];
};
