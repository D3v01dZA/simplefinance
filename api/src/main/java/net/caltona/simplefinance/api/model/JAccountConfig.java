package net.caltona.simplefinance.api.model;

import lombok.*;
import net.caltona.simplefinance.db.model.DAccountConfig;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class JAccountConfig {

    @NonNull
    private String accountId;

    @NonNull
    private String id;

    @NonNull
    private String name;

    @NonNull
    private DAccountConfig.Type type;

    @NonNull
    private String value;

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewAccountConfig {

        @NonNull
        private final String name;

        @NonNull
        private final DAccountConfig.Type type;

        @NonNull
        private final String value;

        public DAccountConfig.NewAccountConfig dNewAccountConfig(String accountId) {
            return new DAccountConfig.NewAccountConfig(accountId, name, type, value);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateAccountConfig {

        private final String value;

        public DAccountConfig.UpdateAccountConfig dUpdateAccountConfig(String accountId, String id) {
            return new DAccountConfig.UpdateAccountConfig(accountId, id, value);
        }

    }

}
