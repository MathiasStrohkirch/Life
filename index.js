// gene connections start with inner neurons so the beginning and end are the same. Ex: 010 for beginning and 0010 for end are the same neuron if there are at least 010 inner neurons

class Neuron {
  constructor(entity) {
    this.value = 0
    this.entity = entity
  }
}

class Connection {
  constructor(weight, input_node, output_node) {
    this.weight = weight
    this.input_node = input_node
    this.output_node = output_node
  }
  
  cycle() {
    return this.input_node.cycle() * this.weight / Math.pow(2, precision - 1)
  }
}

class Input extends Neuron {
  constructor(entity) {
    super(entity);
    this.output_connections = []
  }
}
  
class Output extends Neuron {
  constructor(entity) {
    super(entity);
    this.input_connections = []
  }
}

class Inner extends Neuron {
  constructor(entity, id) {
    super(entity);
    this.input_connections = []
    this.output_connections = []
    this.id = id;
  }

  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    return value /= this.input_connections.length
  }
}

class RandomInput extends Input {
  cycle() {
    return Math.random()
  }
}

class PositiveInput extends Input {
  cycle() {
    return 1
  }
}

class NegativeInput extends Input {
  cycle() {
    return -1
  }
}

class XInput extends Input {
  cycle() {
    return this.entity.x / this.entity.x_bound;
  }
}

class RightOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if (value * reactiveness > Math.random()) {
      this.entity.move(1, 0)
    }
  }
}

class UpOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if (value * reactiveness > Math.random()) {
      this.entity.move(0, 1)
    }
  }
}

class LeftOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if (value * reactiveness > Math.random()) {
      this.entity.move(-1, 0)
    }
  }
}

class DownOutput extends Output {
  cycle() {
    let value = 0

    for (const connection of this.input_connections) {
      value += connection.cycle()
    }

    value /= this.input_connections.length

    if(value * reactiveness > Math.random()) {
      this.entity.move(0, -1)
    }
  }
}

let InputNodes = {
  0: Inner,
  1: RandomInput,
  2: PositiveInput,
  3: NegativeInput,
  4: XInput
}

let OutputNodes = {
  0: Inner,
  1: RightOutput,
  2: UpOutput,
  3: LeftOutput,
  4: DownOutput
}

const EnabledInputNodes = {
  0: 'randomInput',
  1: 'positiveInput',
  2: 'negativeInput',
  3: 'xInput',
  4: 'inner'
}

const EnabledOutputNodes = {
  0: 'rightOutput',
  1: 'upOutput',
  2: 'leftOutput',
  3: 'downOutput'
}

const InputNodeClasses = {
  0: RandomInput,
  1: PositiveInput,
  2: NegativeInput,
  3: XInput
}

const OutputNodeClasses = {
  0: RightOutput,
  1: UpOutput,
  2: LeftOutput,
  3: DownOutput
}

const NodeAbbreviations = {
  'RandomInput': 'R',
  'PositiveInput': 'P',
  'NegativeInput': 'N',
  'XInput': 'X',
  'Inner': 'I',
  'RightOutput': 'R',
  'UpOutput': 'U',
  'LeftOutput': 'L',
  'DownOutput': 'D'
}

let precision = 8 // number of bits used for connection weight
let inner_count = 1
let connections = 5
let mutationProbability = .1
let reactiveness = 1
let input_count = Object.keys(InputNodes).length - inner_count
let output_count = Object.keys(OutputNodes).length - inner_count
let gene_length = get_gene_length();
let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
let neuralNetworkCanvas = document.getElementById("neuralNetworkCanvas");
let neuralNetworkContext = neuralNetworkCanvas.getContext("2d");
context.fillStyle = "#eeeeee";
neuralNetworkContext.fillStyle = "#eeeeee";
neuralNetworkContext.strokeStyle = "#eeeeee";
neuralNetworkContext.font = "30px Monospace";
canvas.addEventListener('click', (e) => click(e), false);
let can_overlap = false;

let entities = null;
let playing = false;
let generation = 0;
let cycle = 0;
let speed = 5;
let amount = 100;
let cycles = 100;
let enabledInputNodes = [true, true, true, true];
let enabledOutputNodes = [true, true, true, true];
let drawingData = null;
let nextRunId = 0;

document.getElementById('cycles').value = cycles;
document.getElementById('entities').value = amount;
document.getElementById('precision').value = precision;
document.getElementById('connections').value = connections;
document.getElementById('mutationProbability').value = mutationProbability;
document.getElementById('reactiveness').value = reactiveness;
document.getElementById('inner').value = inner_count;
document.getElementById('speed').value = speed;

function get_gene_length() {
  return get_bits_required(input_count + inner_count) + get_bits_required(inner_count + output_count) + precision
}

function get_bits_required(number) {
  let largest_value = 2
  let bits = 1

  while (largest_value < number) {
    bits += 1
    largest_value *= 2
  }

  return bits
}

class Entity {
  constructor() {
    this.genome = []
    this.input_neurons = []
    this.inner_neurons = []
    this.output_neurons = []
    this.neurons = []
    this.x = Math.floor(Math.random() * 100)
    this.y = Math.floor(Math.random() * 100)
    this.x_bound = 100
    this.y_bound = 100
  }

  combine(entity) {
    let child = new Entity();
    let genome = []
    
    for (let i = 0; i < connections; i++) {
      let input_connection_genome = null
      let output_connection_genome = null

      if (Math.random() < .5) {
        input_connection_genome = this.get_input_connection_genome(i)
      }
      else {
        input_connection_genome = entity.get_input_connection_genome(i)
      }

      if (Math.random() < .5) {
        output_connection_genome = this.get_output_connection_genome(i)
        if (genomeStringToNumber(input_connection_genome) === genomeStringToNumber(output_connection_genome) && genomeStringToNumber(input_connection_genome) < inner_count) {
          output_connection_genome = entity.get_output_connection_genome(i)
        }
      }
      else {
        output_connection_genome = entity.get_output_connection_genome(i)
        if (genomeStringToNumber(input_connection_genome) === genomeStringToNumber(output_connection_genome) && genomeStringToNumber(input_connection_genome) < inner_count) {
          output_connection_genome = this.get_output_connection_genome(i)
        }
      }

      let gene = input_connection_genome + output_connection_genome

      if (Math.random() < .5) {
        gene += this.get_connection_weight_genome(i)
      }
      else {
        gene += entity.get_connection_weight_genome(i)
      }

      genome.push(genomeStringToNumber(gene))
    }

    child.genome = genome

    return child
  }

  mutate() {
    if (Math.random() > mutationProbability)
      return
    
    let index = Math.floor(Math.random() * connections)

    let old_connection_start = genomeStringToNumber(this.get_input_connection_genome(index))
    let old_connection_end = genomeStringToNumber(this.get_output_connection_genome(index))

    let old_gene = genomeNumberToString(this.genome[index], gene_length)

    let mutation_index = Math.floor(Math.random() * gene_length)

    let new_gene = old_gene.slice(0, mutation_index) + +(genomeStringToNumber(old_gene.slice(mutation_index, mutation_index + 1)) != 1) + old_gene.slice(mutation_index + 1)

    let new_genome = this.genome.slice(0, index)

    new_genome.push(genomeStringToNumber(new_gene))

    new_genome.push(...this.genome.slice(index + 1))

    this.genome = new_genome

    let connection_start = genomeStringToNumber(this.get_input_connection_genome(index))
    let connection_end = genomeStringToNumber(this.get_output_connection_genome(index))

    let changed = false
    old_gene = genomeStringToNumber(new_gene)

    while (true) {
      if (connection_start === connection_end && connection_start < inner_count) {
        if (old_connection_start !== connection_start) {
          connection_start = Math.floor(Math.random() * input_count + inner_count)
          changed = true
        }
        else {
          connection_end = Math.floor(Math.random() * inner_count + output_count)
          changed = true
        }
        continue
      }

      if (connection_start >= input_count + inner_count) {
        connection_start = Math.floor(Math.random() * input_count + inner_count)
        changed = true
        continue
      }

      if (connection_end >= inner_count + output_count) {
        connection_end = Math.floor(Math.random() * inner_count + output_count)
        changed = true
        continue
      }
      
      break
    }

    if (changed) {
      new_gene = genomeNumberToString(connection_start, get_bits_required(input_count + inner_count)) + 
                 genomeNumberToString(connection_end, get_bits_required(inner_count + output_count)) + 
                 this.get_connection_weight_genome(index);
      new_genome = this.genome.slice(0, index)

      new_genome.push(genomeStringToNumber(new_gene))

      new_genome.push(...this.genome.slice(index + 1))

      this.genome = new_genome
    }
  }

  generate_genome() {
    for (let i = 0; i < connections; i++) {
      let connection_start = null
      let connection_end = null
      while (true) {
        connection_start = Math.floor(Math.random() * (input_count + inner_count))
        connection_end = Math.floor(Math.random() * (inner_count + output_count))

        if (!(connection_start === connection_end && connection_start < inner_count)) {
          break
        }
      }

      let p = Math.floor(Math.random() * (Math.pow(2, precision) - 2));

      let a = genomeStringToNumber(
        genomeNumberToString(connection_start, get_bits_required(input_count + inner_count)) + 
        genomeNumberToString(connection_end, get_bits_required(inner_count + output_count)) + 
        genomeNumberToString(p, get_bits_required(Math.pow(2, precision)))
      )
      this.genome.push(
        a
      );
    }
  }

  move(x, y) {
    let new_x = this.x + x
    if (new_x >= 0 && new_x < this.x_bound) {
      this.x = new_x
    }
    
    let new_y = this.y + y
    if (new_y >= 0 && new_y < this.y_bound) {
      this.y = new_y
    }
  }

  get_input_connection_genome(connection) {
    return genomeNumberToString(this.genome[connection], gene_length).substring(0, get_bits_required(input_count + inner_count))
  }

  get_output_connection_genome(connection) {
    return genomeNumberToString(this.genome[connection], gene_length).substring(get_bits_required(input_count + inner_count), get_bits_required(input_count + inner_count) + get_bits_required(inner_count + output_count))
  }

  get_connection_weight_genome(connection) {
    return genomeNumberToString(this.genome[connection], gene_length).substring(get_bits_required(input_count + inner_count) + get_bits_required(inner_count + output_count))
  }

  success() {
    return this.x > 90
  }

  generate_brain() {
    for (let i = 0; i < this.genome.length; i++) {
      let input_neuron = null
      let output_neuron = null

      let input_connection_genome = this.get_input_connection_genome(i)
      let input_connection_type = genomeStringToNumber(input_connection_genome)

      let exists = false

      for (const neuron of this.neurons) {
        if (neuron instanceof InputNodes[input_connection_type]) {
          if (neuron instanceof Inner) {
            if (neuron.id === input_connection_type) {
              input_neuron = neuron
              exists = true
              break
            }
          }
          else {
            input_neuron = neuron
            exists = true
            break
          }
        }
      }

      if (!exists) {
        if (input_connection_type < inner_count) {
          input_neuron = new Inner(this, input_connection_type)
        }
        else {
          input_neuron = new InputNodes[input_connection_type](this)
        }
        this.neurons.push(input_neuron)
        if (input_neuron instanceof Inner) {
          this.inner_neurons.push(input_neuron)
        }
        else {
          this.input_neurons.push(input_neuron)
        }
      }

      let output_connection_genome = this.get_output_connection_genome(i)
      let output_connection_type = genomeStringToNumber(output_connection_genome)

      exists = false

      for (const neuron of this.neurons) {
        if (neuron instanceof OutputNodes[output_connection_type]) {
          if (neuron instanceof Inner) {
            if (neuron.id === output_connection_type) {
              output_neuron = neuron
              exists = true
              break
            }
          }
          else {
            output_neuron = neuron
            exists = true
            break
          }
        }
      }

      if (!exists) {
        if (output_connection_type < inner_count) {
          output_neuron = new Inner(this, output_connection_type)
        }
        else {
          output_neuron = new OutputNodes[output_connection_type](this)
        }
        this.neurons.push(output_neuron)
        if (output_neuron instanceof Inner) {
          this.inner_neurons.push(output_neuron)
        }
        else {
          this.output_neurons.push(output_neuron)
        }
      }

      let c = new Connection(genomeStringToNumber(this.get_connection_weight_genome(i)) - Math.pow(2, (precision - 1)), input_neuron, output_neuron)

      input_neuron.output_connections.push(c)
      output_neuron.input_connections.push(c)

      if (this.hasCycle()) {
        input_neuron.output_connections.pop()
        output_neuron.input_connections.pop()
      }
    }

    this.removeDuplicatesAndDeadEnds()
  }

  hasCycle() {
    for (const neuron of this.input_neurons) {
      if (this.hasCycleRecursive(neuron, [])) {
        return true
      }
    }
    return false
  }

  hasCycleRecursive(neuron, visited) {
    if (visited.includes(neuron)) {
      return true
    }

    visited.push(neuron);

    if (!neuron.output_connections) {
      return false
    }

    for (const connection of neuron.output_connections) {
      if (this.hasCycleRecursive(connection.output_node, [...visited])) {
        return true;
      }
    }

    return false;
  }

  removeDuplicatesAndDeadEnds() {
    let checked = [];
    let connectedNeurons = [];

    for (const output_neuron of this.output_neurons) {
      let neurons = this.removeDuplicatesAndDeadEndsRecursive(output_neuron, checked)
      if (neurons !== null) {
        connectedNeurons.push(...neurons)
      }
    }

    let connectedInputNeurons = []
    for (const neuron of this.input_neurons) {
      if (connectedNeurons.includes(neuron)) {
        connectedInputNeurons.push(neuron)

        let connections = []
        for (const connection of neuron.output_connections) {
          if (connectedNeurons.includes(connection.output_node)) {
            connections.push(connection)
          }
        }
        neuron.output_connections = connections
      }
    }
    this.input_neurons = connectedInputNeurons;

    let connectedInnerNeurons = []
    for (const neuron of this.inner_neurons) {
      if (connectedNeurons.includes(neuron)) {
        connectedInnerNeurons.push(neuron)

        let connections = []
        for (const connection of neuron.input_connections) {
          if (connectedNeurons.includes(connection.input_node)) {
            connections.push(connection)
          }
        }
        neuron.input_connections = connections

        connections = []
        for (const connection of neuron.output_connections) {
          if (connectedNeurons.includes(connection.output_node)) {
            connections.push(connection)
          }
        }
        neuron.output_connections = connections
      }
    }
    this.inner_neurons = connectedInnerNeurons;

    let connectedOutputNeurons = []
    for (const neuron of this.output_neurons) {
      if (connectedNeurons.includes(neuron)) {
        connectedOutputNeurons.push(neuron)

        let connections = []
        for (const connection of neuron.input_connections) {
          if (connectedNeurons.includes(connection.input_node)) {
            connections.push(connection)
          }
        }
        neuron.input_connections = connections
      }
    }
    this.output_neurons = connectedOutputNeurons;

    this.neurons = connectedNeurons;
  }

  removeDuplicatesAndDeadEndsRecursive(neuron, checked) {
    if (checked.includes(neuron)) {
      return null;
    }

    checked.push(neuron);
    if (neuron instanceof Input) {
      return [neuron];
    }
    if (neuron.input_connections.length === 0) {
      return null;
    }
    let subPath = []
    for (const connection of neuron.input_connections) {
      let nodes = this.removeDuplicatesAndDeadEndsRecursive(connection.input_node, checked)
      if (nodes !== null) {
        subPath.push(...nodes)
      }
    }
    if (subPath.length === 0) {
      return null
    }
    subPath.push(neuron);
    return subPath;
  }
    
  cycle() {
    for (const neuron of this.output_neurons) {
      neuron.cycle()
    }
  }

  getNeuralNetworkData() {
    let connections = []
    let neurons = []

    let maxLength = Math.max(this.input_neurons.length, this.inner_neurons.length);
    maxLength = Math.max(maxLength, this.output_neurons.length)

    let input_neuron_offset = (maxLength - this.input_neurons.length) * 40
    let inner_neuron_offset = (maxLength - this.inner_neurons.length) * 40
    let output_neuron_offset = (maxLength - this.output_neurons.length) * 40
    
    let count = 0;

    for (let i = 0; i < this.input_neurons.length; i++) {
      neurons.push({type: 'neuron', parameters: [25, i * 80 + 25 + input_neuron_offset, NodeAbbreviations[this.input_neurons[i].constructor.name]]})
      for (const connection of this.input_neurons[i].output_connections) {
        if (connection.output_node instanceof Inner) {
          for (let j = 0; j < this.inner_neurons.length; j++) {
            if (connection.output_node == this.inner_neurons[j]) {
               connections.push({type: 'connection', parameters: [25, i * 80 + 25 + input_neuron_offset, 115, j * 80 + 25 + inner_neuron_offset, connection.weight / Math.pow(2, precision - 1)]})
              count++;
            }
          }
        }
        else {
          for (let j = 0; j < this.output_neurons.length; j++) {
            if (connection.output_node == this.output_neurons[j]) {
              connections.push({type: 'connection', parameters: [25, i * 80 + 25 + input_neuron_offset, 205, j * 80 + 25 + output_neuron_offset, connection.weight / Math.pow(2, precision - 1)]})
              count++;
            }
          }
        }
      }
    }

    for (let i = 0; i < this.inner_neurons.length; i++) {
      neurons.push({type: 'neuron', parameters: [115, i * 80 + 25 + inner_neuron_offset, NodeAbbreviations[this.inner_neurons[i].constructor.name]]})
      for (const connection of this.inner_neurons[i].output_connections) {
        for (let j = 0; j < this.output_neurons.length; j++) {
          if (connection.output_node == this.output_neurons[j]) {
            connections.push({type: 'connection', parameters: [115, i * 80 + 25 + inner_neuron_offset, 205, j * 80 + 25 + output_neuron_offset, connection.weight / Math.pow(2, precision - 1)]})
            count++;
          }
        }
      }
    }

    for (let i = 0; i < this.output_neurons.length; i++) {
      neurons.push({type: 'neuron', parameters: [205, i * 80 + 25 + output_neuron_offset, NodeAbbreviations[this.output_neurons[i].constructor.name]]})
    }

    return [...connections, ...neurons];
  }
}

function drawCycle() {
  clearCanvas();

  for (const entity of drawingData.entities) {
    drawEntity(entity.x, entity.y);
  }

  document.getElementById('cycle').innerHTML = cycle;
  document.getElementById('generation').innerHTML = generation;
}

function drawNeuralNetwork(data) {
  neuralNetworkContext.clearRect(0, 0, neuralNetworkCanvas.width, neuralNetworkCanvas.height);
  for (const element of data[0]) {
    if (element.type === 'neuron') {
      drawNode(...element.parameters)
    }
    else {
      drawLine(...element.parameters)
    }
  }
}

function drawNode(x, y, name) {
  neuralNetworkContext.beginPath();
  neuralNetworkContext.arc(x, y, 23, 0, 2 * Math.PI);
  neuralNetworkContext.fill();
  neuralNetworkContext.fillStyle = "#888888";
  neuralNetworkContext.fillText(name, x - 8, y + 9);
  neuralNetworkContext.fillStyle = "#eeeeee";
}

function drawLine(x0, y0, x1, y1, width) {
  neuralNetworkContext.beginPath();
  if (width >= 0) {
    width = Math.max(width, .1);
    neuralNetworkContext.lineWidth = width * 10;
    neuralNetworkContext.strokeStyle = '#527ede'
  }
  else {
    width = Math.min(width, -.1);
    neuralNetworkContext.lineWidth = width * -10;
    neuralNetworkContext.strokeStyle = '#de5252'
  }
  neuralNetworkContext.lineWidth = Math.abs(width) * 10;
  neuralNetworkContext.moveTo(x0, y0);
  neuralNetworkContext.lineTo(x1, y1);
  neuralNetworkContext.stroke();
  neuralNetworkContext.lineWidth = 1;
  neuralNetworkContext.strokeStyle = '#eeeeee'
}

function genomeStringToNumber(string) {
  return parseInt(string, 2);
}

function genomeNumberToString(number, length) {
  let string = number.toString(2);
  while (string.length < length) {
    string = '0' + string;
  }
  return string;
}

function drawEntity(x, y) {
  context.beginPath();
  context.fillRect(x * 9, y * 9, 9, 9);
  context.stroke();
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function playPause() {
  playing = !playing;
  if (playing) {
    document.getElementById('playPause').innerHTML = 'Pause'
  }
  else {
    document.getElementById('playPause').innerHTML = 'Play'
  }
}

function changeSpeed(value) {
  if (value < 0 || value > 10) {
    return
  }

  speed = Math.round(value);
}

function changeCycles(value) {
  if (value < 1) {
    return
  }
  
  cycles = value;
}

function changeEntities(value) {
  if (value < 1) {
    return
  }
  
  amount = value;
}

function changePrecision(value) {
  if (value < 0) {
    return
  }
  
  precision = value;
}

function changeConnections(value) {
  if (value < 0) {
    return
  }
  
  connections = value;
}

function changeMutationProbability(value) {
  if (value < 0) {
    return
  }
  
  mutationProbability = value;
}

function changeReactiveness(value) {
  if (value < 0) {
    return
  }
  
  reactiveness = value;
}

function changeInner(value) {
  if (value < 0) {
    return
  }
  
  inner_count = value;
}

function decreaseCycles() {
  if (cycles > 1) {
    cycles--;
    document.getElementById('cycles').value = cycles;
  }
}

function increaseCycles() {
  cycles++;
  document.getElementById('cycles').value = cycles;
}

function decreaseEntities() {
  if (amount > 1) {
    amount--;
    document.getElementById('entities').value = amount;
  }
}

function increaseEntities() {
  amount++;
  document.getElementById('entities').value = amount;
}

function decreasePrecision() {
  if (precision > 1) {
    precision--;
    document.getElementById('precision').value = precision;
  }
}

function increasePrecision() {
  precision++;
  document.getElementById('precision').value = precision;
}

function decreaseConnections() {
  if (connections > 1) {
    connections--;
    document.getElementById('connections').value = connections;
  }
}

function increaseConnections() {
  connections++;
  document.getElementById('connections').value = connections;
}

function decreaseMutationProbability() {
  if (mutationProbability >= .1) {
    mutationProbability -= .1;
    mutationProbability = +(Math.round(mutationProbability + "e+2")  + "e-2")
    document.getElementById('mutationProbability').value = mutationProbability;
  }
}

function increaseMutationProbability() {
  if (mutationProbability <= .9) {
    mutationProbability += .1;
    mutationProbability = +(Math.round(mutationProbability + "e+2")  + "e-2")
    document.getElementById('mutationProbability').value = mutationProbability;
  }
}

function decreaseReactiveness() {
  if (reactiveness >= .1) {
    reactiveness -= .1;
    reactiveness = +(Math.round(reactiveness + "e+2")  + "e-2")
    document.getElementById('reactiveness').value = reactiveness;
  }
}

function increaseReactiveness() {
  reactiveness += .1;
  reactiveness = +(Math.round(reactiveness + "e+2")  + "e-2")
  document.getElementById('reactiveness').value = reactiveness;
}

function decreaseInner() {
  if (inner_count >= 1) {
    inner_count--;
    document.getElementById('inner').value = inner_count;
  }
}

function increaseInner() {
  inner_count++;
  document.getElementById('inner').value = inner_count;
}

function decreaseSpeed() {
  if (speed >= 1) {
    speed --;
    document.getElementById('speed').value = speed;
  }
}

function increaseSpeed() {
  if (speed <= 9) {
    speed ++;
    document.getElementById('speed').value = speed;
  }
}

function click(e) {
  const x = Math.floor(e.offsetX / (e.target.clientWidth / 100));
  const y = Math.floor(e.offsetY / (e.target.clientHeight / 100));
  if (x in drawingData.neuralNetworks && y in drawingData.neuralNetworks[x]) {
    drawNeuralNetwork(drawingData.neuralNetworks[x][y])
  }
}

function enableDisableInputNode(index) {
  enabledInputNodes[index] = !enabledInputNodes[index];

  if (enabledInputNodes[index]) {
    document.getElementById(EnabledInputNodes[index]).className = 'nodeSelected';
  }
  else {
    document.getElementById(EnabledInputNodes[index]).className = 'node';
  }
}

function enableDisableOutputNode(index) {
  enabledOutputNodes[index] = !enabledOutputNodes[index];

  if (enabledOutputNodes[index]) {
    document.getElementById(EnabledOutputNodes[index]).className = 'nodeSelected';
  }
  else {
    document.getElementById(EnabledOutputNodes[index]).className = 'node';
  }
}

function run() {
  input_count = 0;

  for (const enabled of enabledInputNodes) {
    if (enabled) {
      input_count++;
    }
  }

  output_count = 0;

  for (const enabled of enabledOutputNodes) {
    if (enabled) {
      output_count++;
    }
  }

  gene_length = get_gene_length();

  InputNodes = {}

  for (let i = 0; i < inner_count; i++) {
    InputNodes[i] = Inner
  }

  let count = inner_count;

  for (let i = 0; i < enabledInputNodes.length; i++) {
    if (enabledInputNodes[i]) {
      InputNodes[count] = InputNodeClasses[i];
      count++;
    }
  }

  OutputNodes = {}

  for (let i = 0; i < inner_count; i++) {
    OutputNodes[i] = Inner
  }

  count = inner_count;

  for (let i = 0; i < enabledOutputNodes.length; i++) {
    if (enabledOutputNodes[i]) {
      OutputNodes[count] = OutputNodeClasses[i];
      count++;
    }
  }

  document.getElementById('run').className = ''
  document.getElementById('runProgress').className = ''
  document.getElementById('canvas').className = ''
  document.getElementById('canvasControls').className = ''

  entities = []
  cycle = 0
  generation = 0

  for (let i = 0; i < amount; i++) {
    entities.push(new Entity())
  }
    
  for (const entity of entities) {
    entity.generate_genome()
  }

  runCycle(nextRunId++);
}

function runCycle(id) {
  if (id !== nextRunId - 1) {
    return;
  }

  if (cycle === 0) {
    for (const entity of entities) {
      entity.generate_brain()
    }
  }

  drawingData = {entities: [], neuralNetworks: {}}

  for (const entity of entities) {
    entity.cycle();

    drawingData.entities.push({x: entity.x, y: entity.y})

    if (entity.x in drawingData.neuralNetworks) {
      if (entity.y in drawingData.neuralNetworks[entity.x]) {
        drawingData.neuralNetworks[entity.x][entity.y].push(entity.getNeuralNetworkData())
      }
      else {
        drawingData.neuralNetworks[entity.x][entity.y] = [entity.getNeuralNetworkData()]
      }
    }
    else {
      let temp = {}
      temp[entity.y] = [entity.getNeuralNetworkData()]
      drawingData.neuralNetworks[entity.x] = temp
    }
  }

  if (cycle === cycles - 1) {
    let parents = []

    for (const entity of entities) {
      if (entity.success()) {
        parents.push(entity);
      }
    }

    if (parents.length === 0) {
      parents = [...entities]
    }

    entities = [];

    for (let j = 0; j < amount; j++) {
      entities.push(parents[Math.floor(Math.random() * parents.length)].combine(parents[Math.floor(Math.random() * parents.length)]))
    }

    for (const entity of entities) {
      entity.mutate();
    }
  }

  drawCycle();

  cycle++;

  if (cycle === +cycles) {
    cycle = 0;
    generation++;
  }

  if (playing) {
    setTimeout(() => runCycle(id), Math.pow(2, 11 - speed));
  }
  else {
    setTimeout(() => wait(id))
  }
}

function wait(id) {
  if (playing) {
    setTimeout(() => runCycle(id));
  }
  else {
    setTimeout(() => wait(id));
  }
}

function createSelect(options) {
  const select = document.createElement('div');
  const selected = document.createElement('div');

  selected.className = 'selected';

  selected.appendChild(document.createTextNode(options[0]))

  selected.onmouseenter = () => mouseEnter(dropdown);
  select.onmouseleave = () => mouseLeave(dropdown);

  const dropdown = document.createElement('div');

  dropdown.className = 'dropdown'

  select.appendChild(selected);
  select.appendChild(dropdown);

  for (let i = 0; i < options.length; i++) {

    const element = document.createElement('button');

    element.appendChild(document.createTextNode(options[i]))

    if (i === 0) {
      element.className = 'option firstOption'
    }
    else if(i < options.length - 1) {
      element.className = 'option'
    }
    else {
      element.className = 'option lastOption'
    }

    dropdown.appendChild(element);
  }

  document.getElementById('goals').insertBefore(select, document.getElementById('addGoal'))
}

function mouseEnter(dropdown) {
  dropdown.className = 'dropdown open';
}

function mouseLeave(dropdown) {
  dropdown.className = 'dropdown';
}

// createSelect(['hey', 'how', 'are', 'you'])

function addGoal() {
  let goal = document.createElement('div');
  let select = document.createElement('select')
  let option = document.createElement('option')

  option.value = 'heyo'
  option.appendChild(document.createTextNode('heyo'))
  select.appendChild(option)

  let option2 = document.createElement('option')

  option2.value = 'wut'
  option2.appendChild(document.createTextNode('wut'))
  select.appendChild(option2)


  goal.appendChild(select)

  document.getElementById('goals').insertBefore(goal, document.getElementById('addGoal'))
}