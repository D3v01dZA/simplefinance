package net.caltona.simplefinance.service.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface Transaction {

    LocalDate date();

    BigDecimal balance(BigDecimal value);

}
