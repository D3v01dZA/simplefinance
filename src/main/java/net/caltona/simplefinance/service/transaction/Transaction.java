package net.caltona.simplefinance.service.transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface Transaction {

    LocalDateTime date();

    BigDecimal apply(BigDecimal value);

}
