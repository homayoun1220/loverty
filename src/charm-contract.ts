/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api";
import { Charm } from "./charm";

@Info({ title: "CharmContract", description: "My Smart Contract" })
export class CharmContract extends Contract {
    @Transaction(false)
    @Returns("boolean")
    public async charmExists(ctx: Context, charmId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(charmId);
        return !!data && data.length > 0;
    }

    @Transaction(true)
    public async createCharm(
        ctx: Context,
        charmId: string,
        value: string
    ): Promise<void> {
        const exists: boolean = await this.charmExists(ctx, charmId);
        if (exists) {
            throw new Error(`The charm ${charmId} already exists`);
        }
        const charm: Charm = new Charm();
        charm.value = value;
        const buffer: Buffer = Buffer.from(JSON.stringify(charm));
        await ctx.stub.putState(charmId, buffer);
    }

    @Transaction(false)
    @Returns("Charm")
    public async readCharm(ctx: Context, charmId: string): Promise<Charm> {
        const exists: boolean = await this.charmExists(ctx, charmId);
        if (!exists) {
            throw new Error(`The charm ${charmId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(charmId);
        const charm: Charm = JSON.parse(data.toString()) as Charm;
        return charm;
    }

    @Transaction(true)
    public async updateCharm(
        ctx: Context,
        charmId: string,
        newValue: string
    ): Promise<void> {
        const exists: boolean = await this.charmExists(ctx, charmId);
        if (!exists) {
            throw new Error(`The charm ${charmId} does not exist`);
        }
        const charm: Charm = new Charm();
        charm.value = newValue;
        const buffer: Buffer = Buffer.from(JSON.stringify(charm));
        await ctx.stub.putState(charmId, buffer);
    }

    @Transaction(true)
    public async deleteCharm(ctx: Context, charmId: string): Promise<void> {
        const exists: boolean = await this.charmExists(ctx, charmId);
        if (!exists) {
            throw new Error(`The charm ${charmId} does not exist`);
        }
        await ctx.stub.deleteState(charmId);
    }
    @Transaction(false)
    public async queryAllcharms(ctx: Context): Promise<string> {
        const startKey = "000";
        const endKey = "999";
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString());

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString());
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString();
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log("end of data");
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
}
