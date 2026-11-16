#include "wokwi-api.h"
#include <stdio.h>
#include <stdlib.h>

typedef struct {
  uart_dev_t uart;
  timer_t timer;
} chip_state_t;

static void chip_timer_event(void *user_data) {
  chip_state_t *chip = (chip_state_t *)user_data;
  
  uint16_t pm25 = 150;
  uint16_t pm10 = 300;

  uint8_t packet[10];
  packet[0] = 0xAA;
  packet[1] = 0xC0;
  packet[2] = pm25 & 0xFF;
  packet[3] = (pm25 >> 8) & 0xFF;
  packet[4] = pm10 & 0xFF;
  packet[5] = (pm10 >> 8) & 0xFF;
  packet[6] = 0x01;
  packet[7] = 0x01;
  
  uint8_t checksum = 0;
  for (int i = 2; i <= 7; i++) {
    checksum += packet[i];
  }
  packet[8] = checksum;
  packet[9] = 0xAB;

  uart_write(chip->uart, packet, 10);
}

void chip_init() {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  
  const uart_config_t uart_config = {
    .tx = pin_init("TX", INPUT),
    .rx = pin_init("RX", INPUT),
    .baud_rate = 9600,
  };
  chip->uart = uart_init(&uart_config);

  const timer_config_t timer_config = {
    .callback = chip_timer_event,
    .user_data = chip,
  };
  chip->timer = timer_init(&timer_config);
  timer_start(chip->timer, 1000000, true);
}