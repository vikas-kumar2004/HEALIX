#include "wokwi-api.h"
#include <stdlib.h>

typedef struct {
  pin_t pin_sda;
} chip_state_t;

void chip_init() {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  chip->pin_sda = pin_init("SDA", INPUT_PULLUP);
}