package net.caltona.simplefinance.api.model;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.db.model.DSetting;

@Getter
@AllArgsConstructor
public class JSetting {

    @NonNull
    private String id;

    @NonNull
    private String key;

    @NonNull
    private String value;

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewSetting {

        @NonNull
        private String key;

        @NonNull
        private String value;

        public DSetting.NewSetting dNewSetting() {
            return new DSetting.NewSetting(key, value);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateSetting {

        @NonNull
        private String key;

        @NonNull
        private String value;

        public DSetting.UpdateSetting dUpdateSetting(String id) {
            return new DSetting.UpdateSetting(id, key, value);
        }

    }
}
