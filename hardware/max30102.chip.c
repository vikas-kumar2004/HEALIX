#include "wokwi-api.h"
#include <stdlib.h>
#include <math.h>

#define SAMPLE_RATE_HZ 100
#define HEART_RATE_BPM 75
#define TWO_PI 6.28318530718f

typedef struct {
  i2c_dev_t i2c;
  uint8_t registers[256];
  uint8_t current_reg;
  bool reg_set;
  uint8_t fifo_byte_index;
  uint32_t red_sample;
  uint32_t ir_sample;
  uint32_t sample_counter;
  timer_t sample_timer;
} chip_state_t;

static void generate_new_sample(chip_state_t *chip) {
  chip->sample_counter++;

  float phase_inc = (TWO_PI * (HEART_RATE_BPM / 60.0f)) / (float)SAMPLE_RATE_HZ;
  float t = (float)chip->sample_counter * phase_inc;
  float pulse = (sinf(t) + 1.0f) * 0.5f;

  uint32_t red_raw = (uint32_t)(150000.0f + pulse * 8000.0f + (rand() % 50));
  uint32_t ir_raw  = (uint32_t)(160000.0f + pulse * 10000.0f + (rand() % 50));

  chip->red_sample = (red_raw & 0x03FFFF);
  chip->ir_sample  = (ir_raw & 0x03FFFF);

  uint8_t wr_ptr = chip->registers[0x04];
  uint8_t rd_ptr = chip->registers[0x06];

  uint8_t next_wr_ptr = (wr_ptr + 1) & 0x1F;

  if (next_wr_ptr == rd_ptr) {
    if (chip->registers[0x05] < 0x1F) {
      chip->registers[0x05]++;
    }
  } else {
    chip->registers[0x04] = next_wr_ptr;
  }

  chip->registers[0x00] |= 0x40;
}

static void on_sample_timer(void *user_data) {
  chip_state_t *chip = (chip_state_t *)user_data;
  generate_new_sample(chip);
}

static bool on_i2c_connect(void *user_data, uint32_t address, bool connect_type) {
  chip_state_t *chip = (chip_state_t *)user_data;
  chip->reg_set = false;
  return true;
}

static uint8_t on_i2c_read(void *user_data) {
  chip_state_t *chip = (chip_state_t *)user_data;
  uint8_t reg = chip->current_reg;

  if (reg == 0x00) {
    uint8_t val = chip->registers[0x00];
    chip->registers[0x00] &= ~0x40;
    chip->current_reg++;
    return val;
  }

  if (reg == 0x07) {
    uint8_t val = 0;
    switch (chip->fifo_byte_index) {
      case 0: val = (chip->red_sample >> 16) & 0x03; break;
      case 1: val = (chip->red_sample >> 8)  & 0xFF; break;
      case 2: val = (chip->red_sample)       & 0xFF; break;
      case 3: val = (chip->ir_sample >> 16)  & 0x03; break;
      case 4: val = (chip->ir_sample >> 8)   & 0xFF; break;
      case 5: val = (chip->ir_sample)        & 0xFF; break;
    }

    chip->fifo_byte_index = (chip->fifo_byte_index + 1) % 6;

    if (chip->fifo_byte_index == 0) {
      chip->registers[0x06] = (chip->registers[0x06] + 1) & 0x1F;
    }

    return val;
  }

  uint8_t val = chip->registers[reg];
  chip->current_reg++;
  return val;
}

static bool on_i2c_write(void *user_data, uint8_t data) {
  chip_state_t *chip = (chip_state_t *)user_data;

  if (!chip->reg_set) {
    chip->current_reg = data;
    chip->reg_set = true;
    if (data == 0x07) {
      chip->fifo_byte_index = 0;
    }
  } else {
    chip->registers[chip->current_reg] = data;

    if (chip->current_reg == 0x04 || chip->current_reg == 0x06) {
      chip->fifo_byte_index = 0;
      if (chip->current_reg == 0x04) chip->registers[0x05] = 0;
    }

    chip->current_reg++;
  }
  return true;
}

static void on_i2c_disconnect(void *user_data) {}

void chip_init() {
  chip_state_t *chip = calloc(1, sizeof(chip_state_t));

  chip->registers[0xFF] = 0x15;
  chip->registers[0xFE] = 0x00;
  chip->registers[0x00] = 0x00;
  chip->registers[0x01] = 0x00;
  chip->registers[0x04] = 0x00;
  chip->registers[0x05] = 0x00;
  chip->registers[0x06] = 0x00;

  const i2c_config_t i2c_config = {
    .address = 0x57,
    .scl = pin_init("SCL", INPUT),
    .sda = pin_init("SDA", INPUT),
    .connect = on_i2c_connect,
    .read = on_i2c_read,
    .write = on_i2c_write,
    .disconnect = on_i2c_disconnect,
    .user_data = chip,
  };

  chip->i2c = i2c_init(&i2c_config);

  const timer_config_t timer_config = {
    .callback = on_sample_timer,
    .user_data = chip,
  };
  chip->sample_timer = timer_init(&timer_config);
  timer_start(chip->sample_timer, 10000, true);
}