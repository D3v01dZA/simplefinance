package net.caltona.simplefinance.api;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.model.DTransaction;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class JTransaction {

    @NonNull
    private String id;

    @NonNull
    private String description;

    @NonNull
    private Instant date;

    @NonNull
    private BigDecimal value;

    @NonNull
    private DTransaction.Type type;

    @NonNull
    private String accountId;

    private String fromAccountId;

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewTransaction {

        @NonNull
        private String description;

        @NonNull
        private Instant date;

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
