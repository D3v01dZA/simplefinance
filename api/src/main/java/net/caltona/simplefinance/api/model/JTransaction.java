package net.caltona.simplefinance.api.model;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.db.model.DTransaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@AllArgsConstructor
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

        private LocalDate date;

        private BigDecimal value;

        public DTransaction.UpdateTransaction dUpdateTransaction(String accountId, String id) {
            return new DTransaction.UpdateTransaction(accountId, id, description, date, value);
        }

    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JTransaction that = (JTransaction) o;
        return Objects.equals(id, that.id) && Objects.equals(description, that.description) && Objects.equals(date, that.date) && value.compareTo(that.value) == 0 && type == that.type && Objects.equals(accountId, that.accountId) && Objects.equals(fromAccountId, that.fromAccountId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, description, date, value, type, accountId, fromAccountId);
    }
}
