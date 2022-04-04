import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IncHumiditySensorDataRequestDto } from '../dtos';
import { HumidityIncomingEvents, HumidityOutgoingEvents } from '../enums';
import { HumiditySensorsService } from '../services';

@WebSocketGateway()
export class HumiditySensorsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly _humiditySensorsService: HumiditySensorsService;
  private readonly _logger = new Logger(HumiditySensorsGateway.name);
  @WebSocketServer() private readonly _wsServer: Server;
  private _clients: Socket[] = [];

  constructor(
    @Inject(forwardRef(() => HumiditySensorsService))
    humiditySensorsService: HumiditySensorsService,
  ) {
    this._humiditySensorsService = humiditySensorsService;
  }

  /**
   * Right after the connection is established, this method is called.
   * @param client Is the socket client that is connected to the gateway.
   * @returns The list of active humidity sensors.
   */
  async handleConnection(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} connected to the ${HumiditySensorsGateway.name} gateway`,
    );

    this._clients.push(client);

    const registeredSensors =
      await this._humiditySensorsService.getRegisteredHumiditySensors();
    client.emit(HumidityOutgoingEvents.HUMIDITY_REGISTERED_SENSORS, {
      data: registeredSensors,
    });
  }

  /**
   * This method is called when the gateway is disconnected.
   * @param client Is the socket client that is disconnected from the gateway.
   */
  handleDisconnect(client: Socket) {
    this._logger.log(
      `Client with ws id: ${client.id} disconnected from the ${HumiditySensorsGateway.name} gateway`,
    );
    this._clients = this._clients.filter((c) => c.id !== client.id);
  }

  /**
   * This method is called when the gateway is initialized.
   */
  afterInit() {
    this._logger.log('Humidity sensors websocket server initialized');
  }

  /**
   * Returns the humidity data from the cache for the given sensorId, usually you will need this method
   * to get the humidity data from the cache and send it to the client.
   * @param client Is the socket client that is connected to the gateway and that will receive the data.
   * @param payload Is the incoming data from the client which contains the sensor id
   * @returns The cached data for the given sensor id
   */
  @SubscribeMessage(HumidityIncomingEvents.HUMIDITY_DATA)
  async handleMessage(
    client: Socket,
    payload: IncHumiditySensorDataRequestDto,
  ) {
    this._logger.log(`Requested humidity data from ${payload.sensorId}`);
    const cachedData = await this._humiditySensorsService.getHumidityFromCache(
      payload.sensorId,
    );
    client.emit(
      `${HumidityOutgoingEvents.HUMIDITY_UPDATE}-${payload.sensorId}`,
      { data: cachedData },
    );
  }

  /**
   * Emits a message to all the clients connected to the namespace humidity.
   * @param event Is the event that is emitted by the humidity sensor service
   * @param data Is the data that will be emitted to all the clients connected to the gateway
   */
  emitMessage(event: string, data: any) {
    this._wsServer.emit(event, data);
  }
}
