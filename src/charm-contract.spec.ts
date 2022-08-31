/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { CharmContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logging = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('CharmContract', () => {

    let contract: CharmContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new CharmContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"charm 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"charm 1002 value"}'));
    });

    describe('#charmExists', () => {

        it('should return true for a charm', async () => {
            await contract.charmExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a charm that does not exist', async () => {
            await contract.charmExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createCharm', () => {

        it('should create a charm', async () => {
            await contract.createCharm(ctx, '1003', 'charm 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"charm 1003 value"}'));
        });

        it('should throw an error for a charm that already exists', async () => {
            await contract.createCharm(ctx, '1001', 'myvalue').should.be.rejectedWith(/The charm 1001 already exists/);
        });

    });

    describe('#readCharm', () => {

        it('should return a charm', async () => {
            await contract.readCharm(ctx, '1001').should.eventually.deep.equal({ value: 'charm 1001 value' });
        });

        it('should throw an error for a charm that does not exist', async () => {
            await contract.readCharm(ctx, '1003').should.be.rejectedWith(/The charm 1003 does not exist/);
        });

    });

    describe('#updateCharm', () => {

        it('should update a charm', async () => {
            await contract.updateCharm(ctx, '1001', 'charm 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"charm 1001 new value"}'));
        });

        it('should throw an error for a charm that does not exist', async () => {
            await contract.updateCharm(ctx, '1003', 'charm 1003 new value').should.be.rejectedWith(/The charm 1003 does not exist/);
        });

    });

    describe('#deleteCharm', () => {

        it('should delete a charm', async () => {
            await contract.deleteCharm(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a charm that does not exist', async () => {
            await contract.deleteCharm(ctx, '1003').should.be.rejectedWith(/The charm 1003 does not exist/);
        });

    });

});
