import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from '@app/services/state.service';
import { COIN_TO_SUBUNIT_MULTIPLIER, COIN_TICKER, COIN_SUBUNIT_NAME } from '@app/shared/coin.constants';

@Component({
  selector: 'app-btc',
  templateUrl: './btc.component.html',
  styleUrls: ['./btc.component.scss'],
  standalone: false,
})
export class BtcComponent implements OnInit, OnChanges {
  @Input() deweys: number;
  @Input() addPlus = false;
  @Input() valueOverride: string | undefined = undefined;

  value: number;
  unit: string;

  network = '';
  stateSubscription: Subscription;

  constructor(
    private stateService: StateService,
  ) { }

  ngOnInit() {
    this.stateSubscription = this.stateService.networkChanged$.subscribe((network) => this.network = network);
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.deweys >= 1_000_000) {
      this.value = (this.deweys / COIN_TO_SUBUNIT_MULTIPLIER);
      this.unit = COIN_TICKER;
    } else {
      this.value = Math.round(this.deweys);
      this.unit = COIN_SUBUNIT_NAME;
    }
  }
}
