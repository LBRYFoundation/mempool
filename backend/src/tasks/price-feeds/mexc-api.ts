import { query } from '../../utils/axios-query';
import priceUpdater, { PriceFeed, PriceHistory } from '../price-updater';
import logger from '../../logger';

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
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await query(this.url);
        if (response && response['price']) {
          const price = parseFloat(response['price']);
          if (price > 0) {
            return price;
          }
          logger.warn(`MEXC returned non-positive LBC price: ${response['price']}`);
        } else {
          logger.warn(`MEXC returned invalid response (attempt ${attempt}/${maxRetries}): ${JSON.stringify(response)}`);
        }
      } catch (e) {
        logger.warn(`MEXC price fetch failed (attempt ${attempt}/${maxRetries}): ${e instanceof Error ? e.message : e}`);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    return -1;
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
