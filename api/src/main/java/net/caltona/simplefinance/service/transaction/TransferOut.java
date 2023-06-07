package net.caltona.simplefinance.service.transaction;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NonNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@EqualsAndHashCode
@AllArgsConstructor
public class TransferOut implements Transaction {

    @NonNull
    private LocalDate date;

    @NonNull
    private BigDecimal value;

    @Override
    public LocalDate date() {
        return date;
    }

    @Override
    public BigDecimal balance(BigDecimal value) {
        return value;
    }

    @Override
    public BigDecimal transfer(BigDecimal value) {
        return value.subtract(this.value);
    }

    @Override
    public BigDecimal transferReverse(BigDecimal value) {
        return value.add(this.value);
    }
}
