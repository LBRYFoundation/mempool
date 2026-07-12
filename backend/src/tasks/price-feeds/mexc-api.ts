import { query } from '../../utils/axios-query';
import priceUpdater, { PriceFeed, PriceHistory } from '../price-updater';

class MexcApi implements PriceFeed {
  public name: string = 'MEXC';
  public currencies: string[] = ['USD'];

  public url: string = 'https://api.mexc.com/api/v3/ticker/price?symbol=LBCUSDT';
  public urlHist: string = 'https://api.mexc.com/api/v3/klines?symbol=LBCUSDT&interval={INTERVAL}&limit={LIMIT}';

  constructor() {
  }

  /** @asyncUnsafe */
  public async $fetchPrice(currency): Promise<number> {
    if (currency !== 'USD') {
      return -1;
    }
    const response = await query(this.url);
    if (response && response['price']) {
      return parseFloat(response['price']);
    } else {
      return -1;
    }
  }

  /** @asyncUnsafe */
  public async $fetchRecentPrice(currencies: string[], type: 'hour' | 'day'): Promise<PriceHistory> {
    const priceHistory: PriceHistory = {};

    for (const currency of currencies) {
      if (this.currencies.includes(currency) === false) {
        continue;
      }

      const interval = type === 'hour' ? '1h' : '1d';
      const limit = type === 'hour' ? '168' : '90';
      const url = this.urlHist.replace('{INTERVAL}', interval).replace('{LIMIT}', limit);
      const response = await query(url);
      const candles = Array.isArray(response) ? response : [];

      for (const candle of candles as any[]) {
        const time = Math.floor(candle[0] / 1000);
        if (priceHistory[time] === undefined) {
          priceHistory[time] = priceUpdater.getEmptyPricesObj();
        }
        priceHistory[time][currency] = parseFloat(candle[4]);
      }
    }

    return priceHistory;
  }
}

export default MexcApi;
