package net.caltona.simplefinance.api.model;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.db.model.DTransaction;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@EqualsAndHashCode
public class JTransaction {

    @NonNull
    private String id;

    @NonNull
    private String description;

    @NonNull
    private LocalDate date;

    @NonNull
    private BigDecimal value;

    @NonNull
    private DTransaction.Type type;

    @NonNull
    private String accountId;

    private String fromAccountId;

    @java.beans.ConstructorProperties({"id", "description", "date", "value", "type", "accountId", "fromAccountId"})
    public JTransaction(@NonNull String id, @NonNull String description, @NonNull LocalDate date, @NonNull BigDecimal value, @NonNull DTransaction.Type type, @NonNull String accountId, String fromAccountId) {
        this.id = id;
        this.description = description;
        this.date = date;
        this.value = value.setScale(2, RoundingMode.FLOOR);
        this.type = type;
        this.accountId = accountId;
        this.fromAccountId = fromAccountId;
    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewTransaction {

        @NonNull
        private String description;

        @NonNull
        private LocalDate date;

        @NonNull
        private BigDecimal value;

        @NonNull
        private DTransaction.Type type;

        private String fromAccountId;

        public DTransaction.NewTransaction dNewTransaction(String accountId) {
            return new DTransaction.NewTransaction(description, date, value, type, accountId, fromAccountId);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateTransaction {

        private String description;

        private Instant date;

        private BigDecimal value;

        public DTransaction.UpdateTransaction dUpdateTransaction(String accountId, String id) {
            return new DTransaction.UpdateTransaction(accountId, id, description, date, value);
        }

    }

}
