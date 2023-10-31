package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.NonNull;
import net.caltona.simplefinance.api.ExceptionControllerAdvice;
import net.caltona.simplefinance.db.DSettingDAO;
import net.caltona.simplefinance.db.model.DSetting;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class SettingService {

    @NonNull
    private DSettingDAO dSettingDAO;

    public List<DSetting> list() {
        return dSettingDAO.findAll();
    }

    public Optional<DSetting> get(String id) {
        return dSettingDAO.findById(id);
    }

    public Optional<DSetting> findByKey(DSetting.Key key) {
        return dSettingDAO.findByKey(key);
    }

    public DSetting create(DSetting.NewSetting newSetting) {
        return dSettingDAO.save(newSetting.dSetting());
    }

    public Optional<DSetting> update(DSetting.UpdateSetting updateSetting) {
        return dSettingDAO.findById(updateSetting.getId())
                .map(found -> {
                    if (!found.getKey().equals(updateSetting.getKey())) {
                        throw new ExceptionControllerAdvice.BadConfigException(String.format("Cannot update, given key %s does not match original key %s", updateSetting.getKey(), found.getKey()));
                    }
                    found.setValue(updateSetting.getValue());
                    return found;
                });
    }

    public Optional<DSetting> delete(String id) {
        return dSettingDAO.findById(id)
                .map(found -> {
                    dSettingDAO.delete(found);
                    return found;
                });
    }

}
