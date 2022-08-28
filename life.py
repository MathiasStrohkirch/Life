import random
from enum import Enum
import math

class NeuronTypes(Enum):
  random_input = 1
  positive_input = 2
  negative_input = 3
  inner_a = 4
  right_output = 5
  up_output = 6
  left_output = 7
  down_output = 8

# gene connections start with inner neurons so the beginning and end are the same. Ex: 010 for beginning and 0010 for end are the same neuron if there are at least 010 inner neurons

class Entity:
  def __init__(self):
    self.precision = 8 # number of bits used for connection weight
    self.input_count = 3
    self.inner_count = 1
    self.output_count = 4
    self.connection_count = 5
    self.genome = []
    self.gene_length = self.get_gene_length()
    self.output_neurons = []
    self.neurons = []
    self.x = random.randint(0, 99)
    self.y = random.randint(0, 99)
    self.x_bound = 100
    self.y_bound = 100
    self.mutation_chance = .01

  def combine(self, entity):
    child = Entity()
    genome = []
    
    for i in range(self.connection_count):
      input_connection_genome = None
      output_connection_genome = None

      if random.randint(0, 1) == 1:
        input_connection_genome = self.get_input_connection_genome(i)
      else:
        input_connection_genome = entity.get_input_connection_genome(i)

      if random.randint(0, 1) == 1:
        output_connection_genome = self.get_output_connection_genome(i)
        if int(input_connection_genome, 2) == int(output_connection_genome, 2) and int(input_connection_genome, 2) < self.inner_count:
          output_connection_genome = entity.get_output_connection_genome(i)
      else:
        output_connection_genome = entity.get_output_connection_genome(i)
        if int(input_connection_genome, 2) == int(output_connection_genome, 2) and int(input_connection_genome, 2) < self.inner_count:
          output_connection_genome = self.get_output_connection_genome(i)

      gene = input_connection_genome + output_connection_genome

      if random.randint(0, 1) == 1:
        gene += self.get_connection_weight_genome(i)
      else:
        gene += entity.get_connection_weight_genome(i)

      genome.append(int(gene, 2))

    child.genome = genome

    return child

  def mutate(self):
    if random.random() > self.mutation_chance:
      return
    
    index = random.randint(0, self.connection_count - 1)

    old_connection_start = int(self.get_input_connection_genome(index), 2)
    old_connection_end = int(self.get_output_connection_genome(index), 2)

    old_gene = format(self.genome[index], '0' + str(self.gene_length) + 'b')

    mutation_index = random.randint(0, self.gene_length - 1)

    new_gene = old_gene[0:mutation_index] + format(int(old_gene[mutation_index:mutation_index + 1]) ^ 1, '01b') + old_gene[mutation_index + 1:]

    new_genome = self.genome[0:index]

    new_genome.append(int(new_gene, 2))

    new_genome += self.genome[index + 1:]

    self.genome = new_genome

    connection_start = int(self.get_input_connection_genome(index), 2)
    connection_end = int(self.get_output_connection_genome(index), 2)

    changed = False
    old_gene = int(new_gene, 2)

    while True:
      if connection_start == connection_end and connection_start < self.inner_count:
        if not old_connection_start == connection_start:
          connection_start = random.randint(0, self.input_count + self.inner_count - 2)
          changed = True
        else:
          connection_end = random.randint(0, self.inner_count + self.output_count - 2)
          changed = True
        continue

      if connection_start >= self.input_count + self.inner_count - 1:
        connection_start = random.randint(0, self.input_count + self.inner_count - 2)
        changed = True
        continue

      if connection_end >= self.inner_count + self.output_count - 1:
        connection_end = random.randint(0, self.inner_count + self.output_count - 2)
        changed = True
        continue
      
      break

    if changed:
      new_gene = format(connection_start, '0' + str(self.get_bits_required(self.input_count + self.inner_count)) + 'b') + format(connection_end, '0' + str(self.get_bits_required(self.inner_count + self.output_count)) + 'b') + self.get_connection_weight_genome(index)
      new_genome = self.genome[0:index]

      new_genome.append(int(new_gene, 2))

      new_genome += self.genome[index + 1:]

      self.genome = new_genome

  def get_gene_length(self):
    return self.get_bits_required(self.input_count + self.inner_count) + self.get_bits_required(self.inner_count + self.output_count) + self.precision

  def generate_genome(self):
    for connection in range(self.connection_count):
      while True:
        connection_start = random.randint(0, self.input_count + self.inner_count - 1)
        connection_end = random.randint(0, self.inner_count + self.output_count - 1)

        if not(connection_start == connection_end and connection_start < self.inner_count):
          break

      a = format(random.randint(0, (2 ** self.precision) - 1), '0' + str(self.precision) + 'b')
      self.genome.append(int(format(connection_start, '0' + str(self.get_bits_required(self.input_count + self.inner_count)) + 'b') + format(connection_end, '0' + str(self.get_bits_required(self.inner_count + self.output_count)) + 'b') + a, 2))

  def get_bits_required(self, number):
    largest_value = 2
    bits = 1

    while largest_value < number:
      bits += 1
      largest_value *= 2

    return bits

  def move(self, x, y):
    new_x = self.x + x
    if new_x > 0 and new_x < self.x_bound:
      self.x = new_x
    
    new_y = self.y + y
    if new_y > 0 and new_y < self.y_bound:
      self.y = new_y

  def get_input_connection_genome(self, connection):
    return format(self.genome[connection], '0' + str(self.gene_length) + 'b')[0:self.get_bits_required(self.input_count + self.inner_count)]
  
  def get_output_connection_genome(self, connection):
    return format(self.genome[connection], '0' + str(self.gene_length) + 'b')[self.get_bits_required(self.input_count + self.inner_count):self.get_bits_required(self.input_count + self.inner_count) + self.get_bits_required(self.inner_count + self.output_count)]

  def get_connection_weight_genome(self, connection):
    return format(self.genome[connection], '0' + str(self.gene_length) + 'b')[self.get_bits_required(self.input_count + self.inner_count) + self.get_bits_required(self.inner_count + self.output_count):]

  def success(self):
    return self.x > 95 and self.y > 95

  def generate_brain(self):
    for connection in range(len(self.genome)):
      input_neuron = None
      output_neuron = None

      input_connection_genome = self.get_input_connection_genome(connection)
      input_connection_type = int(input_connection_genome, 2)

      if input_connection_type == 0: # Inner
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'Inner':
            input_neuron = neuron
            exists = True
            break
        if not exists:
          input_neuron = Inner()
          self.neurons.append(input_neuron)
      elif input_connection_type == 1: # RandomInput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'RandomInput':
            input_neuron = neuron
            exists = True
            break
        if not exists:
          input_neuron = RandomInput()
          self.neurons.append(input_neuron)
      elif input_connection_type == 2: # PositiveInput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'PositiveInput':
            input_neuron = neuron
            exists = True
            break
        if not exists:
          input_neuron = PositiveInput()
          self.neurons.append(input_neuron)
      elif input_connection_type == 3: # NegativeInput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'NegativeInput':
            input_neuron = neuron
            exists = True
            break
        if not exists:
          input_neuron = NegativeInput()
          self.neurons.append(input_neuron)

      output_connection_genome = self.get_output_connection_genome(connection)
      output_connection_type = int(output_connection_genome, 2)

      if output_connection_type == 0: # Inner
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'Inner':
            output_neuron = neuron
            exists = True
            break
        if not exists:
          output_neuron = Inner()
          self.neurons.append(output_neuron)
      elif output_connection_type == 1: # RightOutput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'RightOutput':
            output_neuron = neuron
            exists = True
            break
        if not exists:
          output_neuron = RightOutput()
          self.neurons.append(output_neuron)
          self.output_neurons.append(output_neuron)
      elif output_connection_type == 2: # UpOutput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'UpOutput':
            output_neuron = neuron
            exists = True
            break
        if not exists:
          output_neuron = UpOutput()
          self.neurons.append(output_neuron)
          self.output_neurons.append(output_neuron)
      elif output_connection_type == 3: # LeftOutput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'LeftOutput':
            output_neuron = neuron
            exists = True
            break
        if not exists:
          output_neuron = LeftOutput()
          self.neurons.append(output_neuron)
          self.output_neurons.append(output_neuron)
      elif output_connection_type == 4: # DownOutput
        exists = False
        for neuron in self.neurons: # see if one already exists
          if type(neuron).__name__ == 'DownOutput':
            output_neuron = neuron
            exists = True
            break
        if not exists:
          output_neuron = DownOutput()
          self.neurons.append(output_neuron)
          self.output_neurons.append(output_neuron)

      c = Connection(int(self.get_connection_weight_genome(connection), 2) - 2 ** (self.precision - 1), input_neuron, output_neuron)

      input_neuron.output_connections.append(c)
      output_neuron.input_connections.append(c)
    
  def cycle(self):
    for neuron in self.output_neurons:
      neuron.cycle(self)

class Neuron:
  def __init__(self):
    self.value = 0

class Connection:
  def __init__(self, weight, input_node, output_node):
    self.weight = weight
    self.input_node = input_node
    self.output_node = output_node
  
  def cycle(self):
    return self.input_node.cycle() * self.weight

class Input(Neuron):
  def __init__(self):
    self.output_connections = []
  
class Output(Neuron):
  def __init__(self):
    self.input_connections = []

class Inner(Neuron):
  def __init__(self):
    self.input_connections = []
    self.output_connections = []

  def cycle(self):
    value = 0

    for connection in self.input_connections:
      value += connection.cycle()

    return math.tanh(value)

class RandomInput(Input):
  def cycle(self):
    return random.random()

class PositiveInput(Input):
  def cycle(self):
    return 1

class NegativeInput(Input):
  def cycle(self):
    return -1

class RightOutput(Output):
  def cycle(self, entity):
    value = 0

    for connection in self.input_connections:
      value += connection.cycle()

    if value > 0 and math.tanh(value) > random.random():
      entity.move(1, 0)

class UpOutput(Output):
  def cycle(self, entity):
    value = 0

    for connection in self.input_connections:
      value += connection.cycle()

    if value > 0 and math.tanh(value) > random.random():
      entity.move(0, 1)

class LeftOutput(Output):
  def cycle(self, entity):
    value = 0

    for connection in self.input_connections:
      value += connection.cycle()

    if value > 0 and math.tanh(value) > random.random():
      entity.move(-1, 0)

class DownOutput(Output):
  def cycle(self, entity):
    value = 0

    for connection in self.input_connections:
      value += connection.cycle()

    if value > 0 and math.tanh(value) > random.random():
      entity.move(0, -1)

entities = []

amount = 100
cycles = 100
generations = 1000

for i in range(amount):
  entities.append(Entity())

for entity in entities:
  entity.generate_genome()

for i in range(generations):
  for entity in entities:
    entity.generate_brain()
    for j in range (cycles):
      entity.cycle()

  parents = []

  for entity in entities:
    if entity.success():
      parents.append(entity)

  print('Generation: ', i, '     Percent Success: ', int(len(parents) / amount * 100))

  entities = []

  for i in range(amount):
    entities.append(parents[random.randint(0, len(parents) - 1)].combine(parents[random.randint(0, len(parents) - 1)]))

  for entity in entities:
    entity.mutate()