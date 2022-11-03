// gene connections start with inner neurons so the beginning and end are the same. Ex: 010 for beginning and 0010 for end are the same neuron if there are at least 010 inner neurons

// todo:
// have variables instead of always using getBitsRequired
// have functions to replace inputTrait, outputTrait, weight rather than having to substring
// input field limits and validation
// make dropdowns for node enablers, goals, and tests
// copy neural network to test button
// allow test (and normal) entities to have less than the limit of connections? Use zero weights and just don't show in neural network?
// show mutations slider
// hide select dropdown on select
// add more goals - minimize connections? distance from others? distance traveled?
// add more nodes - kill?
// show percent success?
// easy way to switch to test and back without restarting run
// non-binary goals - goal weights
// only get neural network data when clicking the entity
// highlight selected entity?
// make input nodes connect to each other in neural network
// make connections not overlap completely? be able to move neural network nodes around?
// figure out how to get a value if neuron is ouputting 0. Inverter that takes 0-1 to 1-0?

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
  3: 'downOutput',
  4: 'inner'
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
let inputTraitLength = get_bits_required(input_count + inner_count)
let outputTraitLength = get_bits_required(output_count + inner_count)
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
let spaces = [];

resetSpaces();

let playing = false;
let testRunning = false;
let testCycle = 0;
let generation = 0;
let cycle = 0;
let speed = 5;
let amount = 100;
let cycles = 100;
let enabledInputNodes = [true, true, true, true];
let enabledOutputNodes = [true, true, true, true];
let drawingData = null;
let nextRunId = 0;
let nextTestRunId = 0;

let inputSelectors = [];
let outputSelectors = [];
let weightSelectors = [];
let weightTexts = [];

document.getElementById('cycles').value = cycles;
document.getElementById('entities').value = amount;
document.getElementById('precision').value = precision;
document.getElementById('connections').value = connections;
document.getElementById('mutationProbability').value = mutationProbability;
document.getElementById('reactiveness').value = reactiveness;
document.getElementById('inner').value = inner_count;
document.getElementById('speed').value = speed;

setInputAndOutputNodes();

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
  constructor(isTest) {
    this.isTest = isTest;
    this.genome = []
    this.input_neurons = []
    this.inner_neurons = []
    this.output_neurons = []
    this.neurons = []
    if (!(document.getElementById('allowOverlap').checked)) {
      while (true) {
        this.x = Math.floor(Math.random() * 100)
        this.y = Math.floor(Math.random() * 100)
        if (!spaces[this.x][this.y]) {
          break;
        }
      }
      spaces[this.x][this.y] = true;
    }
    else {
      this.x = Math.floor(Math.random() * 100)
      this.y = Math.floor(Math.random() * 100)
    }
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
    let oldX = this.x
    let oldY = this.y

    let new_x = this.x + x
    let new_y = this.y + y

    if (!(new_x >= 0 && new_x < this.x_bound) && !(new_y >= 0 && new_y < this.y_bound)) {
      return
    }
    else if (!(new_x >= 0 && new_x < this.x_bound)) {
      new_x = oldX;
    }
    else if (!(new_y >= 0 && new_y < this.y_bound)) {
      new_y = oldY;
    }

    if (document.getElementById('allowOverlap').checked || this.isTest) {
      this.x = new_x;
      this.y = new_y;
    }
    else {
      if (!spaces[new_x][new_y]) {
        this.x = new_x
        this.y = new_y
      }
      else if (!spaces[new_x][this.y] && !spaces[this.x][new_y]) { // random case to move x or y if either are free
        if (Math.random() < .5) {
          this.x = new_x
        }
        else {
          this.y = new_y
        }
      }
      else if (!spaces[new_x][this.y]) {
        this.x = new_x
      }
      else if (!spaces[this.x][new_y]) {
        this.y = new_y
      }

      spaces[oldX][oldY] = false;
      spaces[this.x][this.y] = true;
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
    for (const goal of Object.values(goals)) {
      if (goal.type === Goals[1]) {
        let x0 = 0;
        let x1 = 0;
        let y0 = 0;
        let y1 = 0;

        if (goal.x1 < goal.x0) {
          x0 = goal.x1
          x1 = goal.x0
        }
        else {
          x0 = goal.x0
          x1 = goal.x1
        }

        if (goal.y1 < goal.y0) {
          y0 = goal.y1
          y1 = goal.y0
        }
        else {
          y0 = goal.y0
          y1 = goal.y1
        }

        if (this.x >= x0 && this.x <= x1 && this.y >= y0 && this.y <= y1) {
          return true;
        }
      }
    }
    return false;
  }

  generate_brain() {
    // for (const gene of this.genome) {
    //   console.log(genomeNumberToString(gene, gene_length))
    // }
    
    this.neurons = []
    this.input_neurons = []
    this.inner_neurons = []
    this.output_neurons = []

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
    let connectedNeurons = [];

    for (const output_neuron of this.output_neurons) {
      let checked = [];
      let neurons = this.removeDuplicatesAndDeadEndsRecursive(output_neuron, checked)
      if (neurons !== null) {
        for (const neuron of neurons) {
          if (!connectedNeurons.includes(neuron)){
            connectedNeurons.push(neuron)
          }
        }
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
      let subchecked = [...checked]
      let nodes = this.removeDuplicatesAndDeadEndsRecursive(connection.input_node, subchecked)
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

  reset() {
    this.x = Math.floor(Math.random() * 100)
    this.y = Math.floor(Math.random() * 100)
  }
}

function drawCycle() {
  clearCanvas();

  if (drawingData) {
    for (const entity of drawingData.entities) {
      drawEntity(entity.x, entity.y);
    }
  }

  drawGoals();

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

function genomeReplaceInputTrait(genome, inputTrait) {
  
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

  let oldPrecision = precision;
  
  precision = value;

  setInputAndOutputNodes();

  updateTestPrecision(oldPrecision);
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

  let oldInnerCount = inner_count;

  inner_count = value;

  setInputAndOutputNodes();

  updateTestInnerCount(oldInnerCount);
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
    let oldPrecision = precision;
    precision--;
    document.getElementById('precision').value = precision;

    setInputAndOutputNodes();

    updateTestPrecision(oldPrecision);
  }
}

function increasePrecision() {
  let oldPrecision = precision;
  precision++;
  document.getElementById('precision').value = precision;

  setInputAndOutputNodes();

  updateTestPrecision(oldPrecision);
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
    let oldInnerCount = inner_count;
    inner_count--;
    document.getElementById('inner').value = inner_count;
    setInputAndOutputNodes();
    updateTestInnerCount(oldInnerCount);
  }
}

function increaseInner() {
  let oldInnerCount = inner_count;
  inner_count++;
  document.getElementById('inner').value = inner_count;
  setInputAndOutputNodes();
  updateTestInnerCount(oldInnerCount);
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

function showGoals() {
  drawCycle();
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
  document.getElementById('run').className = ''
  document.getElementById('canvas').className = ''
  document.getElementById('canvasControls').className = ''

  testRunning = false

  entities = []
  resetSpaces();
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

  if (!playing && !(generation === 0 && cycle === 0)) {
    setTimeout(() => wait(id))
    return;
  }

  if (cycle === 0) {
    for (const entity of entities) {
      entity.generate_brain()
    }
  }

  drawingData = {entities: [], neuralNetworks: {}}

  for (const entity of entities) {
    if (!(cycle === 0 && generation === 0))
    {
      entity.cycle();
    }

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

    resetSpaces();
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
  if (playing && !testRunning) {
    setTimeout(() => runCycle(id));
  }
  else {
    setTimeout(() => wait(id));
  }
}

function createSelect(options, callbacks) {
  const select = document.createElement('div');

  select.className = 'select'

  const space = document.createElement('div');

  space.className = 'space'

  const selected = document.createElement('div');

  selected.className = 'selected';

  selected.appendChild(document.createTextNode(options[0]))

  selected.onmouseenter = () => mouseEnter(select, options.length);
  select.onmouseleave = () => mouseLeave(select);

  const dropdown = document.createElement('div');

  dropdown.className = 'dropdown'

  select.appendChild(selected);
  select.appendChild(dropdown);

  for (let i = 0; i < options.length; i++) {
    const element = document.createElement('div');

    element.appendChild(document.createTextNode(options[i]))

    if (i === 0) {
      element.className = 'option'
    }
    else if(i < options.length - 1) {
      element.className = 'option'
    }
    else {
      element.className = 'option'
    }

    element.onclick = () => {
      clickOption(selected, options[i], dropdown)
      if (callbacks) callbacks[i]();
    }

    dropdown.appendChild(element);
  }

  return [select, space];
}

function mouseEnter(select, optionsCount) {
  select.style.setProperty('--height', (optionsCount < 3 ? (optionsCount + 1) : 4.5) * 29 + 'px');
}

function mouseLeave(select) {
  select.className = 'select';
}

function clickOption(selected, value, dropdown) {
  selected.removeChild(selected.lastChild)
  selected.appendChild(document.createTextNode(value))
  dropdown.className = 'dropdown';
}

const Goals = {
  0: 'new',
  1: 'position'
}

let goals = {}
let nextGoalId = 0

addGoal(Goals[1], {'x0': 0, 'y0': 0, 'x1': 10, 'y1': 100})

function addGoal(type, parameters) {
  let goal = document.createElement('div');

  goal.className = 'goal';

  let [select, space] = createSelect(['Position Goal'], () => addGoal(Goals[1]))

  goal.appendChild(select)
  goal.appendChild(space)

  const deleteButton = document.createElement('button')

  deleteButton.className = 'deleteButton'
  
  let temp = nextGoalId;

  deleteButton.onclick = () => deleteGoal(temp, goal)

  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  svg.setAttribute('viewbox', '0 0 24 24');
  svg.setAttribute('width', '24px');
  svg.setAttribute('height', '24px');
  
  deleteButton.appendChild(svg);

  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', 'M8 8 L16 16 Z');
  path.setAttribute('stroke', '#eeeeee');
  
  svg.appendChild(path);

  path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', 'M8 16 L16 8 Z');
  path.setAttribute('stroke', '#eeeeee');
  
  svg.appendChild(path);

  goal.appendChild(deleteButton)

  if (type === Goals[1]) {
    goal.appendChild(document.createTextNode('From'))
    const pointA = document.createElement('div')
    const xText = document.createTextNode('x : ')
    const x = document.createElement('input')
    x.className = 'small';
    x.type = 'number'
    x.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'x0')
    pointA.appendChild(xText);
    pointA.appendChild(x);
    const yText = document.createTextNode('y : ')
    const y = document.createElement('input')
    y.className = 'small';
    y.type = 'number'
    y.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'y0')
    pointA.appendChild(yText);
    pointA.appendChild(y);
    goal.appendChild(pointA);

    goal.appendChild(document.createTextNode('To'))
    const pointB = document.createElement('div')
    const xTextB = document.createTextNode('x : ')
    const xB = document.createElement('input')
    xB.className = 'small';
    xB.type = 'number'
    xB.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'x1')
    pointB.appendChild(xTextB);
    pointB.appendChild(xB);
    const yTextB = document.createTextNode('y : ')
    const yB = document.createElement('input')
    yB.className = 'small';
    yB.type = 'number'
    yB.onchange = (e) => updateGoal(temp, parseInt(e.target.value), 'y1')
    pointB.appendChild(yTextB);
    pointB.appendChild(yB);
    goal.appendChild(pointB);

    if (parameters) {
      x.value = parameters.x0;
      y.value = parameters.y0;
      xB.value = parameters.x1;
      yB.value = parameters.y1;

      goals[nextGoalId++] = {'type': type, 'x0': parameters.x0, 'y0': parameters.y0, 'x1': parameters.x1, 'y1': parameters.y1}
    }
    else {
      goals[nextGoalId++] = {'type': type, 'x0': null, 'y0': null, 'x1': null, 'y1': null}
    }
  }

  document.getElementById('goals').insertBefore(goal, document.getElementById('addGoal'))
}

function drawPositionGoal(x0, y0, x1, y1) {
  context.fillStyle = "#eeeeee30";
  context.beginPath();
  context.fillRect(x0 * 9, y0 * 9, (x1 - x0) * 9, (y1 - y0) * 9);
  context.stroke();
  context.fillStyle = "#eeeeee";
}

function drawGoals() {
  if (!document.getElementById('showGoals').checked) {
    return;
  }
  for (const goal of Object.values(goals)) {
    if (goal.type === Goals[1]) {
      drawPositionGoal(goal.x0, goal.y0, goal.x1, goal.y1)
    }
  }
}

function deleteGoal(id, goal) {
  delete goals[id];
  goal.remove()
  drawCycle()
}

function updateGoal(id, e, parameter) {
  goals[id][parameter] = e
  drawCycle()
}

function resetSpaces() {
  if (document.getElementById('allowOverlap').checked) {
    return;
  }
  spaces = [];
  for (let i = 0; i < 100; i++) {
    spaces.push([]);
    for (let j = 0; j < 100; j++) {
      spaces[i].push(false);
    }
  }
}

let testGenes = []

function test() {
  if (playing) {
    playPause()
  }
}

function addTestGene(index) {
  let gene = document.createElement('div')

  gene.className = 'gene'

  let from = document.createTextNode('From')

  let options = []
  let callbacks = []

  for (let i = 0; i < Object.values(EnabledInputNodes).length; i++) {
    options.push(Object.values(EnabledInputNodes)[i])
    callbacks.push(() => updateTestGenome(index, selectorNeuronToGenomeIndex(i)))
  }

  let [select, space] = createSelect(options, callbacks)

  inputSelectors.push(select)

  let div = document.createElement('div')
  div.className = 'genePart'

  div.appendChild(from)
  div.appendChild(select)
  div.appendChild(space)

  gene.appendChild(div)

  let to = document.createTextNode('To')

  gene.appendChild(to)

  options = []
  callbacks = []

  for (let i = 0; i < Object.values(EnabledOutputNodes).length; i++) {
    options.push(Object.values(EnabledOutputNodes)[i])
    callbacks.push(() => updateTestGenome(index, undefined, selectorNeuronToGenomeIndex(i)))
  }

  [select, space] = createSelect(options, callbacks)

  outputSelectors.push(select)

  gene.appendChild(select)
  gene.appendChild(space)

  gene.appendChild(document.createTextNode('Weight'))

  let weightText = document.createElement('p')
  weightText.innerHTML = '127'

  weightTexts.push(weightText);

  let weight = document.createElement('input');
  weight.type = 'range'
  weight.min = -Math.pow(2, precision - 1) + 1
  weight.max = Math.pow(2, precision - 1) - 1
  weight.value = weight.max
  weight.className = 'numberSlider'
  weight.onchange = (e) => updateTestGenome(index, undefined, undefined, parseInt(e.target.value) + Math.pow(2, precision - 1))
  weight.oninput = (e) => {weightText.innerHTML = e.target.value}

  weightSelectors.push(weight);

  gene.appendChild(weight)

  gene.appendChild(weightText)

  document.getElementById('test').appendChild(gene)
}

for(let i = 0; i < connections; i++) {
  addTestGene(i)
}

function selectorNeuronToGenomeIndex(i) {
  if (i < input_count) {
    return i + inner_count;
  }
  else {
    return i - input_count;
  }
}

let testEntity = new Entity(true)
testEntity.genome = []

for (let i = 0; i < connections; i++) {
  testEntity.genome.push(genomeStringToNumber('00100111111111'))
}

function updateTestGenome(index, from, to, weight) {
  let gene = genomeNumberToString(testEntity.genome[index], gene_length);

  if (from !== undefined) {
    gene = genomeNumberToString(from, get_bits_required(input_count + inner_count)) + gene.substring(get_bits_required(input_count + inner_count))
  }

  if (to !== undefined) {
    gene = gene.substring(0, get_bits_required(input_count + inner_count)) + genomeNumberToString(to, get_bits_required(output_count + inner_count)) + gene.substring(gene_length - precision)
  }

  if (weight !== undefined) {
    gene = gene.substring(0, gene_length - precision) + genomeNumberToString(weight, precision)
  }

  testEntity.genome[index] = genomeStringToNumber(gene);

  testEntity.generate_brain();

  drawNeuralNetwork([testEntity.getNeuralNetworkData()])
}

function updateTestInnerCount(oldCount) {
  // todo: have to account for input/output trait lenght changes due to adding/removing inner nodes

  // todo: combine the input selector and output selector code into another function that we call twice here

  // todo: if either input or output needs to be longer, make it longer. Check each individually. Then, update the genome to the new values.
  //       then, if either input or output need to be shorter, make it shorter. Check each individually. Can only be shorter or longer

  // let oldGeneLength = get_bits_required(input_count + oldCount) + get_bits_required(output_count + oldCount) + precision

  // if (oldCount < inner_count && ((get_bits_required(input_count + oldCount) !== get_bits_required(input_count + inner_count)) || (get_bits_required(input_count + oldCount) !== get_bits_required(input_count + inner_count)))) { // if we need more length, do it before
  //   for (let i = 0; i < connections; i++) {
  //     let resizedInputTrait = genomeNumberToString()
  //   }
  // }

  let oldGeneLength = get_bits_required(input_count + oldCount) + get_bits_required(output_count + oldCount) + precision

  let tempGeneLength = oldGeneLength

  let tempInnerCount = oldCount

  if (oldCount < inner_count) {
    if (get_bits_required(input_count + oldCount) !== get_bits_required(input_count + inner_count)) { // input trait length increased
      // for (const gene of testEntity.genome) {
      //   console.log('before increase', genomeNumberToString(gene, tempGeneLength))
      // }
  
      for (let i = 0; i < connections; i++) {
        let resizedInputTrait = ''

        for (let j = 0; j < get_bits_required(input_count + inner_count) - get_bits_required(input_count + oldCount); j++) {
          resizedInputTrait = resizedInputTrait + '0'
        }
        
        resizedInputTrait = resizedInputTrait + genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(0, get_bits_required(input_count + oldCount))

        // console.log(resizedInputTrait)

        let resizedOutputTrait = ''

        for (let j = 0; j < get_bits_required(output_count + inner_count) - get_bits_required(output_count + oldCount); j++) {
          resizedOutputTrait = resizedOutputTrait + '0'
        }
        
        resizedOutputTrait = resizedOutputTrait + genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(0, get_bits_required(output_count + oldCount))

        testEntity.genome[i] = resizedInputTrait + resizedOutputTrait + genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(oldGeneLength - precision)
      }

      tempGeneLength = gene_length
      //todo: use this because inner count is not accurate. console.log(5) is messing up
      tempInnerCount = inner_count

      // for (const gene of testEntity.genome) {
      //   console.log('after increase', genomeNumberToString(gene, tempGeneLength))
      // }
    }
  }

  for (let j = 0; j < inputSelectors.length; j++) {
    if (oldCount > inner_count) {
      // console.log(1)
      for (let i = inner_count; i < oldCount; i++) {
        inputSelectors[j].children[1].children[inputSelectors[j].children[1].children.length - 1].remove()
      }

      let inputTrait = genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(0, get_bits_required(input_count + tempInnerCount))

      if (genomeStringToNumber(inputTrait) >= oldCount) {
        // console.log(2)
        testEntity.genome[j] = genomeStringToNumber(genomeNumberToString(genomeStringToNumber(inputTrait) - 1, get_bits_required(input_count + tempInnerCount)) + genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(get_bits_required(input_count + tempInnerCount)))
      }
      else if (genomeStringToNumber(inputTrait) === oldCount - 1) { // if we removed the selected inner node
        // console.log(5)
        let newInputTraitNumber = inner_count - 1

        if (inner_count === 0) {
          newInputTraitNumber = input_count - 1
        }

        clickOption(inputSelectors[j].children[0], inputSelectors[j].children[1].children[inputSelectors[j].children[1].children.length - 1].textContent, inputSelectors[j].children[1])

        testEntity.genome[j] = genomeStringToNumber(genomeNumberToString(newInputTraitNumber, get_bits_required(input_count + tempInnerCount)) + genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(get_bits_required(input_count + tempInnerCount)))
      }
    }
    else if (oldCount < inner_count) {
      for (let i = oldCount; i < inner_count; i++) {
        const element = document.createElement('div');

        element.appendChild(document.createTextNode('whaaa'))

        element.className = 'option'

        let neuronIndex = input_count + inner_count - 1;

        element.onclick = () => {
          clickOption(inputSelectors[j].children[0], 'whaaa', inputSelectors[j].children[1])
          updateTestGenome(j, selectorNeuronToGenomeIndex(neuronIndex))
        }

        inputSelectors[j].children[1].appendChild(element);
      }

      let inputTrait = genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(0, get_bits_required(input_count + tempInnerCount))

      if (genomeStringToNumber(inputTrait) >= oldCount) { // if an input node was selected
        testEntity.genome[j] = genomeStringToNumber(genomeNumberToString(genomeStringToNumber(inputTrait) + 1, get_bits_required(input_count + tempInnerCount)) + genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(get_bits_required(input_count + tempInnerCount)))
      }
    }
    
    inputSelectors[j].children[0].onmouseenter = () => mouseEnter(inputSelectors[j], input_count + inner_count)
  }

  // for (const gene of testEntity.genome) {
  //   console.log(genomeNumberToString(gene, tempGeneLength))
  // }

  for (let j = 0; j < outputSelectors.length; j++) {
    if (oldCount > inner_count) {
      // console.log(3)
      for (let i = inner_count; i < oldCount; i++) {
        outputSelectors[j].children[1].children[outputSelectors[j].children[1].children.length - 1].remove()
      }

      let outputTrait = genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(get_bits_required(input_count + tempInnerCount), get_bits_required(input_count + tempInnerCount) + get_bits_required(output_count + tempInnerCount))

      if (genomeStringToNumber(outputTrait) >= oldCount) {
        // console.log(4)
        testEntity.genome[j] = genomeStringToNumber(genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(0, get_bits_required(input_count + tempInnerCount)) + genomeNumberToString(genomeStringToNumber(outputTrait) - 1, get_bits_required(output_count + tempInnerCount)) + genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(tempGeneLength - precision))
      }
      else if (genomeStringToNumber(outputTrait) === oldCount - 1) { // if we removed the selected inner node
        let newOutputTraitNumber = inner_count - 1

        if (inner_count === 0) {
          newOutputTraitNumber = output_count - 1
        }

        clickOption(outputSelectors[j].children[0], outputSelectors[j].children[1].children[outputSelectors[j].children[1].children.length - 1].textContent, outputSelectors[j].children[1])

        testEntity.genome[j] = genomeStringToNumber(genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(0, get_bits_required(input_count + tempInnerCount)) + genomeNumberToString(newOutputTraitNumber, get_bits_required(output_count + tempInnerCount)) + genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(tempGeneLength - precision))
      }
    }
    else if (oldCount < inner_count) {
      for (let i = oldCount; i < inner_count; i++) {
        const element = document.createElement('div');

        element.appendChild(document.createTextNode('whaaa'))

        element.className = 'option'

        let neuronIndex = output_count + inner_count - 1;

        element.onclick = () => {
          clickOption(outputSelectors[j].children[0], 'whaaa', outputSelectors[j].children[1])
          updateTestGenome(j, undefined, selectorNeuronToGenomeIndex(neuronIndex))
        }

        outputSelectors[j].children[1].appendChild(element);
      }

      let outputTrait = genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(get_bits_required(input_count + tempInnerCount), get_bits_required(input_count + tempInnerCount) + get_bits_required(output_count + tempInnerCount))

      if (genomeStringToNumber(outputTrait) >= oldCount) {
        testEntity.genome[j] = genomeStringToNumber(genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(0, get_bits_required(input_count + tempInnerCount)) + genomeNumberToString(genomeStringToNumber(outputTrait) + 1, get_bits_required(output_count + tempInnerCount)) + genomeNumberToString(testEntity.genome[j], tempGeneLength).substring(get_bits_required(input_count + tempInnerCount) + get_bits_required(output_count + tempInnerCount)))
      }
    }

    outputSelectors[j].children[0].onmouseenter = () => mouseEnter(outputSelectors[j], output_count + inner_count)
  }

  // for (const gene of testEntity.genome) {
  //   console.log('before decrease', genomeNumberToString(gene, tempGeneLength))
  // }

  if (oldCount > inner_count) {
    if (get_bits_required(input_count + oldCount) !== get_bits_required(input_count + inner_count)) { // input trait length decreased
      for (let i = 0; i < connections; i++) {
        let resizedInputTrait = genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(get_bits_required(input_count + oldCount) - get_bits_required(input_count + inner_count), get_bits_required(input_count + oldCount))

        let resizedOutputTrait = genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(get_bits_required(input_count + oldCount) + get_bits_required(output_count + oldCount) - get_bits_required(output_count + inner_count), get_bits_required(input_count + oldCount) + get_bits_required(output_count + oldCount))

        testEntity.genome[i] = genomeStringToNumber(resizedInputTrait + resizedOutputTrait + genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(oldGeneLength - precision))
      }
    }
  }
}

function updateTestPrecision(oldPrecision) {  
  let oldGeneLength = gene_length - precision + oldPrecision
  for (let i = 0; i < testEntity.genome.length; i++) {
    let weight = genomeStringToNumber(genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(oldGeneLength - oldPrecision))

    weight -= Math.pow(2, oldPrecision - 1);

    weight *= Math.pow(2, precision - oldPrecision)

    weightTexts[i].innerHTML = weight

    weightSelectors[i].min = -Math.pow(2, precision - 1) + 1
    weightSelectors[i].max = Math.pow(2, precision - 1) - 1
    weightSelectors[i].value = weight

    weight += Math.pow(2, precision - 1)

    testEntity.genome[i] = genomeNumberToString(genomeStringToNumber(genomeNumberToString(testEntity.genome[i], oldGeneLength).substring(0, oldGeneLength - oldPrecision)), get_bits_required(input_count + inner_count) + get_bits_required(output_count + inner_count)) + genomeNumberToString(weight, precision)
  }
}

function setInputAndOutputNodes() {
  input_count = 0;

  for (const enabled of enabledInputNodes) {
    if (enabled) {
      input_count++;
    }
  }

  inputTraitLength = get_bits_required(input_count + inner_count)

  output_count = 0;

  for (const enabled of enabledOutputNodes) {
    if (enabled) {
      output_count++;
    }
  }

  outputTraitLength = get_bits_required(output_count + inner_count)

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
}

function runTest() {
  testRunning = true;

  if (playing) {
    playPause();
  }

  testCycle = 0;
  document.getElementById('generation').innerHTML = 0;

  runCycleTest(nextTestRunId++);
}

function runCycleTest(id) {
  if (id !== nextTestRunId - 1) {
    return;
  }
  clearCanvas();

  drawEntity(testEntity.x, testEntity.y);

  if (testCycle !== 0) {
    testEntity.cycle();
    document.getElementById('cycle').innerHTML = testCycle;
  }

  testCycle++

  if (testCycle >= cycles) {
    testCycle = 0;
    testEntity.reset();
  }

  if (playing && testRunning) {
    setTimeout(() => runCycleTest(id), Math.pow(2, 11 - speed));
  }
  else {
    setTimeout(() => waitTest(id));
  }
}

function waitTest(id) {
  if (playing && testRunning) {
    setTimeout(() => runCycleTest(id));
  }
  else {
    setTimeout(() => waitTest(id));
  }
}