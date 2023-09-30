package net.caltona.simplefinance.api;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import net.caltona.simplefinance.api.model.JSetting;
import net.caltona.simplefinance.db.model.DSetting;
import net.caltona.simplefinance.service.SettingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class SettingController {

    @NonNull
    private SettingService settingService;

    @Transactional
    @GetMapping("/api/setting/")
    public List<JSetting> list() {
        return settingService.list().stream()
                .map(DSetting::json)
                .collect(Collectors.toList());
    }

    @Transactional
    @GetMapping("/api/setting/{id}/")
    public Optional<JSetting> get(@PathVariable String id) {
        return settingService.get(id)
                .map(DSetting::json);
    }

    @Transactional
    @PostMapping("/api/setting/{id}/")
    public Optional<JSetting> update(@PathVariable String id, @RequestBody JSetting.UpdateSetting updateSetting) {
        return settingService.update(updateSetting.dUpdateSetting(id))
                .map(DSetting::json);
    }

    @Transactional
    @PostMapping("/api/setting/")
    public JSetting create(@RequestBody JSetting.NewSetting newSetting) {
        return settingService.create(newSetting.dNewSetting())
                .json();
    }

    @Transactional
    @DeleteMapping("/api/setting/{id}/")
    public Optional<JSetting> delete(@PathVariable String id) {
        return settingService.delete(id)
                .map(DSetting::json);
    }

}
