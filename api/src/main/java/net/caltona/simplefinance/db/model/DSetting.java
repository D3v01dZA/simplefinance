package net.caltona.simplefinance.db.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.model.JSetting;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor

@Entity(name = "setting")
public class DSetting {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private Key key;

    @Column
    private String value;

    public DSetting(Key key, String value) {
        this.key = key;
        this.value = value;
    }

    public JSetting json() {
        return new JSetting(id, key, value);
    }

    public enum Key {

        DEFAULT_TRANSACTION_FROM_ACCOUNT_ID,
        TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewSetting {

        @NonNull
        private Key key;

        @NonNull
        private String value;

        public DSetting dSetting() {
            return new DSetting(key, value);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateSetting {

        @NonNull
        private String id;

        @NonNull
        private Key key;

        @NonNull
        private String value;

    }
}
