import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IncTemperatureSensorDto } from '../dtos';
import { TempIncomingEvents, TempOutgoingEvents } from '../enums';
import { TemperatureSensorsService } from '../services';

@WebSocketGateway()
export class TemperatureSensorsGateway
  implements OnGatewayInit, OnGatewayConnection
{
  private readonly _temperatureSensorsService: TemperatureSensorsService;
  private readonly _logger = new Logger(TemperatureSensorsGateway.name);
  @WebSocketServer() private readonly _wsServer: Server;
  private clients: Socket[] = [];

  constructor(
    @Inject(forwardRef(() => TemperatureSensorsService))
    temperatureSensorsService: TemperatureSensorsService,
  ) {
    this._temperatureSensorsService = temperatureSensorsService;
  }

  /**
   * Right after the connection is established, this method is called.
   * @param client Is the socket client that is connected to the gateway.
   * @returns The list of active temperature sensors.
   */
  async handleConnection(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} connected to the ${TemperatureSensorsGateway.name} gateway`,
    );

    this.clients.push(client);

    const activeSensors =
      await this._temperatureSensorsService.getActiveTemperatureSensors();
    client.emit(TempOutgoingEvents.TEMPERATURE_ACTIVE_SENSORS, {
      data: activeSensors,
    });
  }

  /**
   * This method is called when the gateway is initialized.
   */
  afterInit() {
    this._logger.log('Websocket server initialized');
  }

  /**
   * Returns the temperature data from the cache for the given sensorId, usually you will need this method
   * to get the temperature data from the cache and send it to the client.
   * @param client Is the socket client that is connected to the gateway and that will receive the data.
   * @param payload Is the incoming data from the client which contains the sensor id
   * @returns The cached data for the given sensor id
   */
  @SubscribeMessage(TempIncomingEvents.TEMPERATURE_DATA)
  async handleMessage(client: Socket, payload: IncTemperatureSensorDto) {
    this._logger.log(`Received temperature data from ${payload.sensorId}`);
    const cachedData =
      await this._temperatureSensorsService.getTemperatureFromCache(
        payload.sensorId,
      );
    client.emit(TempOutgoingEvents.TEMPERATURE_UPDATE, { data: cachedData });
  }

  /**
   * Emits a message to all the clients connected to the namespace temperature.
   * @param event Is the event that is emitted by the temperature sensor service
   * @param data Is the data that will be emitted to all the clients connected to the gateway
   */
  emitMessage(event: string, data: any) {
    this._wsServer.emit(event, data);
  }
}
