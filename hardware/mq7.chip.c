#include "wokwi-api.h"
#include <stdlib.h>

typedef struct {
  pin_t pin_aout;
  pin_t pin_hout;
  timer_t timer;
  uint32_t high_count;
  uint32_t total_samples;
  float current_volts;
} chip_state_t;

static void chip_timer_event(void *user_data) {
  chip_state_t *chip = (chip_state_t *)user_data;
  
  // Sample PWM pin level every 1ms
  if (pin_read(chip->pin_hout) == HIGH) {
    chip->high_count++;
  }
  chip->total_samples++;

  // Evaluate PWM Duty Cycle every 100ms
  if (chip->total_samples >= 100) {
    float duty_cycle = (float)chip->high_count / (float)chip->total_samples;
    chip->high_count = 0;
    chip->total_samples = 0;

    // Duty cycle > 50% indicates High Heat (5V / Purge) Phase
    if (duty_cycle > 0.50f) {
      pin_dac_write(chip->pin_aout, 0.3f);
    } else {
      // Low Heat (1.4V / Read) Phase -> Smooth Random Walk (1.1V - 2.1V)
      float delta = ((float)(rand() % 100) / 100.0f - 0.5f) * 0.05f;
      chip->current_volts += delta;
      
      if (chip->current_volts < 1.1f) chip->current_volts = 1.1f;
      if (chip->current_volts > 2.1f) chip->current_volts = 2.1f;

      pin_dac_write(chip->pin_aout, chip->current_volts);
    }
  }
}

void chip_init() {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  
  chip->pin_aout = pin_init("AOUT", ANALOG);
  chip->pin_hout = pin_init("HOUT", INPUT);
  chip->high_count = 0;
  chip->total_samples = 0;
  chip->current_volts = 1.5f;

  const timer_config_t timer_config = {
    .callback = chip_timer_event,
    .user_data = chip,
  };
  chip->timer = timer_init(&timer_config);
  timer_start(chip->timer, 1000, true); // 1ms timer
}